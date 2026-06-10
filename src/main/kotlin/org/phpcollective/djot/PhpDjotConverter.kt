package org.phpcollective.djot

import com.intellij.openapi.diagnostic.Logger
import java.io.File
import java.util.concurrent.TimeUnit

object PhpDjotConverter {

    private val LOG = Logger.getInstance(PhpDjotConverter::class.java)

    private val inlineScript = """
        require_once 'vendor/autoload.php';
        use Djot\DjotConverter;

        ${'$'}input = file_get_contents('php://stdin');
        ${'$'}converter = new DjotConverter();
        echo ${'$'}converter->convert(${'$'}input);
    """.trimIndent()

    fun toHtml(
        djot: String,
        phpPath: String = "php",
        scriptPath: String = "",
        workingDir: String? = null,
    ): Result<String> {
        val effectivePhpPath = phpPath.ifBlank { "php" }

        if (workingDir != null && !File(workingDir).isDirectory) {
            return Result.failure(Exception("Working directory does not exist or is not a directory: $workingDir"))
        }

        // An explicitly configured converter script must be a usable file: surface
        // the misconfiguration rather than silently falling back to a different converter.
        if (scriptPath.isNotBlank() && !File(scriptPath).isFile) {
            return Result.failure(Exception("Configured converter script does not exist or is not a file: $scriptPath"))
        }

        // Ordered list of converter commands. The first one that succeeds wins;
        // a failing command falls through to the next so a missing/broken CLI
        // never hides an otherwise working converter.
        val commands = buildCommands(effectivePhpPath, scriptPath, workingDir)

        var lastFailure: Result<String> = Result.failure(Exception("No PHP converter command available"))
        for (command in commands) {
            val result = runCommand(command, djot, workingDir)
            if (result.isSuccess) {
                return result
            }
            lastFailure = result
        }
        return lastFailure
    }

    /**
     * Builds the ordered converter command candidates.
     *
     * 1. A user-provided custom converter script, when configured. Used exclusively
     *    so an explicit override is never silently bypassed.
     * 2. Otherwise the `vendor/bin/djot` CLI shipped by php-collective/djot (reads
     *    Djot from stdin, writes HTML to stdout), with the inline script as a
     *    fallback for older versions without the CLI or PHP builds where the CLI
     *    cannot run (e.g. missing ext-posix).
     */
    private fun buildCommands(
        phpPath: String,
        scriptPath: String,
        workingDir: String?,
    ): List<List<String>> {
        if (scriptPath.isNotBlank() && File(scriptPath).isFile) {
            return listOf(listOf(phpPath, scriptPath))
        }

        val commands = mutableListOf<List<String>>()
        val cliBinary = workingDir?.let { File(it, "vendor/bin/djot") }
        if (cliBinary != null && cliBinary.isFile) {
            commands += listOf(phpPath, cliBinary.absolutePath)
        }
        commands += listOf(phpPath, "-r", inlineScript)
        return commands
    }

    private fun runCommand(
        command: List<String>,
        djot: String,
        workingDir: String?,
    ): Result<String> {
        // Label the command for logs without dumping the multi-line inline script.
        val label = when {
            command.contains("-r") -> "inline script"
            command.size >= 2 -> command[1]
            else -> command.joinToString(" ")
        }
        return try {
            LOG.info("PHP Djot: running [$label] in $workingDir")

            val processBuilder = ProcessBuilder(command)
                .redirectErrorStream(false)

            if (workingDir != null) {
                processBuilder.directory(File(workingDir))
            }

            val process = processBuilder.start()

            // Drain stdout/stderr on separate threads so a large document cannot
            // fill the OS pipe buffer and deadlock the process before waitFor().
            val stdout = StringBuilder()
            val stderr = StringBuilder()
            val outThread = Thread { process.inputStream.bufferedReader().use { stdout.append(it.readText()) } }
            val errThread = Thread { process.errorStream.bufferedReader().use { stderr.append(it.readText()) } }
            outThread.start()
            errThread.start()

            process.outputStream.bufferedWriter().use { writer ->
                writer.write(djot)
            }

            val completed = process.waitFor(10, TimeUnit.SECONDS)
            if (!completed) {
                process.destroyForcibly()
                outThread.join(1000)
                errThread.join(1000)
                return Result.failure(Exception("PHP process timed out"))
            }
            outThread.join()
            errThread.join()

            val exitCode = process.exitValue()
            if (exitCode != 0) {
                LOG.warn("PHP Djot [$label] failed: $stderr")
                return Result.failure(Exception("PHP exited with code $exitCode: $stderr"))
            }

            val html = stdout.toString()
            LOG.info("PHP Djot [$label]: converted ${djot.length} chars to ${html.length} chars")
            Result.success(html)
        } catch (e: Exception) {
            LOG.warn("PHP Djot [$label] exception", e)
            Result.failure(e)
        }
    }
}
