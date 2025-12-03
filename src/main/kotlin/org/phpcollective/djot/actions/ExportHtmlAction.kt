package org.phpcollective.djot.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.fileChooser.FileChooserFactory
import com.intellij.openapi.fileChooser.FileSaverDescriptor
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.intellij.openapi.vfs.VirtualFile
import org.phpcollective.djot.DjotFileType
import java.io.File

class ExportHtmlAction : AnAction() {

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val file = e.getData(CommonDataKeys.VIRTUAL_FILE) ?: return

        val document = FileDocumentManager.getInstance().getDocument(file) ?: return
        val content = document.text

        // Show save dialog
        val descriptor = FileSaverDescriptor(
            "Export to HTML",
            "Choose location to save HTML file",
            "html"
        )

        val defaultName = file.nameWithoutExtension + ".html"
        val saveDialog = FileChooserFactory.getInstance().createSaveFileDialog(descriptor, project)
        val wrapper = saveDialog.save(file.parent, defaultName) ?: return

        // Convert and save
        ApplicationManager.getApplication().executeOnPooledThread {
            val html = convertToHtml(project, content)
            val fullHtml = wrapFullHtml(file.nameWithoutExtension, html)

            ApplicationManager.getApplication().invokeLater {
                try {
                    wrapper.file.writeText(fullHtml)
                    Messages.showInfoMessage(
                        project,
                        "Exported to ${wrapper.file.absolutePath}",
                        "Export Successful"
                    )
                } catch (ex: Exception) {
                    Messages.showErrorDialog(
                        project,
                        "Failed to export: ${ex.message}",
                        "Export Error"
                    )
                }
            }
        }
    }

    private fun convertToHtml(project: Project, djot: String): String {
        // Try djot-php first
        try {
            val phpCode = "require_once 'vendor/autoload.php'; " +
                "\$c = new \\Djot\\DjotConverter(); " +
                "echo \$c->convert(file_get_contents('php://stdin'));"
            val process = ProcessBuilder("php", "-r", phpCode)
                .directory(project.basePath?.let { File(it) })
                .redirectErrorStream(true)
                .start()

            process.outputStream.bufferedWriter().use { it.write(djot) }
            process.outputStream.close()

            val result = process.inputStream.bufferedReader().readText()
            val exitCode = process.waitFor()

            if (exitCode == 0 && result.isNotBlank()) return result
        } catch (_: Exception) {}

        // Try npx djot (Node.js)
        try {
            val process = ProcessBuilder("npx", "djot")
                .directory(project.basePath?.let { File(it) })
                .redirectErrorStream(false)
                .start()

            process.outputStream.bufferedWriter().use { it.write(djot) }
            process.outputStream.close()

            val result = process.inputStream.bufferedReader().readText()
            val exitCode = process.waitFor()

            if (exitCode == 0 && result.isNotBlank()) return result
        } catch (_: Exception) {}

        // Fallback: show warning comment in output
        return "<!-- WARNING: Export requires djot-php or Node.js djot package for proper rendering.\n" +
               "     Install: composer require php-collective/djot-php\n" +
               "     Or: npm install -g @djot/djot -->\n\n" +
               fallbackConvert(djot)
    }

    private fun fallbackConvert(djot: String): String {
        // Basic fallback - headings, emphasis, code only
        return djot
            .replace(Regex("^###### (.+)$", RegexOption.MULTILINE), "<h6>$1</h6>")
            .replace(Regex("^##### (.+)$", RegexOption.MULTILINE), "<h5>$1</h5>")
            .replace(Regex("^#### (.+)$", RegexOption.MULTILINE), "<h4>$1</h4>")
            .replace(Regex("^### (.+)$", RegexOption.MULTILINE), "<h3>$1</h3>")
            .replace(Regex("^## (.+)$", RegexOption.MULTILINE), "<h2>$1</h2>")
            .replace(Regex("^# (.+)$", RegexOption.MULTILINE), "<h1>$1</h1>")
            .replace(Regex("\\*([^*]+)\\*"), "<strong>$1</strong>")
            .replace(Regex("_([^_]+)_"), "<em>$1</em>")
            .replace(Regex("`([^`]+)`"), "<code>$1</code>")
            .replace(Regex("\\{=([^=]+)=\\}"), "<mark>$1</mark>")
            .replace(Regex("^---+$", RegexOption.MULTILINE), "<hr>")
            .replace(Regex("^\\*\\*\\*+$", RegexOption.MULTILINE), "<hr>")
            .replace("\n\n", "</p>\n<p>")
            .let { "<p>$it</p>" }
            .replace(Regex("<p>(<h[1-6]>)"), "$1")
            .replace(Regex("(</h[1-6]>)</p>"), "$1")
            .replace(Regex("<p>(<hr>)</p>"), "$1")
            .replace("<p></p>", "")
    }

    private fun wrapFullHtml(title: String, content: String): String {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>$title</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        color: #333;
                    }
                    h1 { border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                    h2 { border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                    code {
                        background: #f4f4f4;
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-family: 'JetBrains Mono', Consolas, monospace;
                    }
                    pre {
                        background: #f4f4f4;
                        padding: 15px;
                        border-radius: 5px;
                        overflow-x: auto;
                    }
                    pre code { background: none; padding: 0; }
                    blockquote {
                        border-left: 4px solid #3498db;
                        margin: 0;
                        padding-left: 20px;
                        color: #666;
                    }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px 12px; }
                    th { background: #f8f9fa; }
                    mark { background: #fff3cd; }
                </style>
            </head>
            <body>
                $content
            </body>
            </html>
        """.trimIndent()
    }

    override fun update(e: AnActionEvent) {
        val file = e.getData(CommonDataKeys.VIRTUAL_FILE)
        e.presentation.isEnabledAndVisible = file?.extension == DjotFileType.defaultExtension
    }
}
