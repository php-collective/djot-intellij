package org.phpcollective.djot

import org.graalvm.polyglot.Context
import org.graalvm.polyglot.Source
import java.net.URL

/**
 * Converts Djot markup to HTML using djot.js via GraalJS.
 */
object DjotConverter {

    private val djotJs: String by lazy {
        try {
            URL("https://cdn.jsdelivr.net/npm/@djot/djot@0.3.2/dist/djot.js").readText()
        } catch (e: Exception) {
            // Fallback: return empty, will use fallback converter
            ""
        }
    }

    private val contextBuilder: Context.Builder by lazy {
        Context.newBuilder("js")
            .allowAllAccess(false)
            .option("engine.WarnInterpreterOnly", "false")
    }

    fun toHtml(djot: String): String {
        if (djotJs.isEmpty()) {
            return fallbackConvert(djot)
        }

        return try {
            contextBuilder.build().use { context ->
                // Load djot.js
                context.eval(Source.newBuilder("js", djotJs, "djot.js").build())

                // Convert djot to HTML
                val escaped = djot
                    .replace("\\", "\\\\")
                    .replace("`", "\\`")
                    .replace("\$", "\\\$")
                    .replace("\r\n", "\\n")
                    .replace("\r", "\\n")
                    .replace("\n", "\\n")

                val result = context.eval("js", """
                    (function() {
                        var doc = djot.parse(`$escaped`);
                        return djot.renderHTML(doc);
                    })();
                """.trimIndent())

                result.asString()
            }
        } catch (e: Exception) {
            fallbackConvert(djot)
        }
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
}
