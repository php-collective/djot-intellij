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
        return try {
            val effectivePhpPath = phpPath.ifBlank { "php" }
            val command = if (scriptPath.isNotBlank() && File(scriptPath).exists()) {
                listOf(effectivePhpPath, scriptPath)
            } else {
                listOf(effectivePhpPath, "-r", inlineScript)
            }

            LOG.info("PHP Djot: Running command in $workingDir")

            val processBuilder = ProcessBuilder(command)
                .redirectErrorStream(false)

            if (workingDir != null) {
                val dir = File(workingDir)
                if (dir.exists()) {
                    processBuilder.directory(dir)
                } else {
                    return Result.failure(Exception("Working directory does not exist: $workingDir"))
                }
            }

            val process = processBuilder.start()

            process.outputStream.bufferedWriter().use { writer ->
                writer.write(djot)
            }

            val completed = process.waitFor(10, TimeUnit.SECONDS)
            if (!completed) {
                process.destroyForcibly()
                return Result.failure(Exception("PHP process timed out"))
            }

            val exitCode = process.exitValue()
            if (exitCode != 0) {
                val error = process.errorStream.bufferedReader().readText()
                LOG.warn("PHP Djot failed: $error")
                return Result.failure(Exception("PHP exited with code $exitCode: $error"))
            }

            val html = process.inputStream.bufferedReader().readText()
            LOG.info("PHP Djot: Successfully converted ${djot.length} chars to ${html.length} chars")
            Result.success(html)
        } catch (e: Exception) {
            LOG.error("PHP Djot exception", e)
            Result.failure(e)
        }
    }
}
