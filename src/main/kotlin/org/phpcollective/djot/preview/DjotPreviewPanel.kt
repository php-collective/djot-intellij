package org.phpcollective.djot.preview

import com.intellij.openapi.Disposable
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.editor.colors.EditorColorsListener
import com.intellij.openapi.editor.colors.EditorColorsManager
import com.intellij.openapi.editor.colors.EditorColorsScheme
import com.intellij.openapi.editor.event.DocumentEvent
import com.intellij.openapi.editor.event.DocumentListener
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.ui.jcef.JBCefBrowser
import com.intellij.util.messages.MessageBusConnection
import java.awt.BorderLayout
import java.util.concurrent.atomic.AtomicBoolean
import javax.swing.JComponent
import javax.swing.JPanel
import javax.swing.Timer

class DjotPreviewPanel(
    private val project: Project,
    private val file: VirtualFile
) : Disposable {

    private val panel = JPanel(BorderLayout())
    private val browser: JBCefBrowser = JBCefBrowser()
    private val updatePending = AtomicBoolean(false)
    private val updateTimer: Timer
    private var initialized = false
    private val messageBusConnection: MessageBusConnection

    private val documentListener = object : DocumentListener {
        override fun documentChanged(event: DocumentEvent) {
            scheduleUpdate()
        }
    }

    init {
        panel.add(browser.component, BorderLayout.CENTER)

        // Debounce updates (300ms delay)
        updateTimer = Timer(300) {
            if (updatePending.getAndSet(false)) {
                updatePreview()
            }
        }
        updateTimer.isRepeats = false

        // Listen for document changes
        val document = FileDocumentManager.getInstance().getDocument(file)
        document?.addDocumentListener(documentListener, this)

        // Listen for theme changes
        messageBusConnection = ApplicationManager.getApplication().messageBus.connect(this)
        messageBusConnection.subscribe(EditorColorsManager.TOPIC, EditorColorsListener {
            updateTheme()
        })

        // Initial render - load the HTML shell with djot.js
        loadPreviewShell()
    }

    val component: JComponent get() = panel

    private fun isDarkTheme(): Boolean {
        val scheme = EditorColorsManager.getInstance().globalScheme
        val background = scheme.defaultBackground
        // Calculate luminance to determine if dark
        val luminance = (0.299 * background.red + 0.587 * background.green + 0.114 * background.blue) / 255
        return luminance < 0.5
    }

    private fun scheduleUpdate() {
        updatePending.set(true)
        updateTimer.restart()
    }

    private fun updateTheme() {
        if (!initialized) return
        val isDark = isDarkTheme()
        ApplicationManager.getApplication().invokeLater {
            browser.cefBrowser.executeJavaScript(
                "document.body.classList.toggle('dark', $isDark); document.body.classList.toggle('light', ${!isDark});",
                browser.cefBrowser.url,
                0
            )
        }
    }

    private fun loadPreviewShell() {
        val document = FileDocumentManager.getInstance().getDocument(file)
        val content = document?.text ?: ""
        val escapedContent = escapeForJs(content)
        val isDark = isDarkTheme()

        browser.loadHTML(createPreviewHtml(escapedContent, isDark))
        initialized = true
    }

    private fun updatePreview() {
        if (!initialized) {
            loadPreviewShell()
            return
        }

        ApplicationManager.getApplication().executeOnPooledThread {
            val document = FileDocumentManager.getInstance().getDocument(file)
            val content = document?.text ?: return@executeOnPooledThread
            val escapedContent = escapeForJs(content)

            ApplicationManager.getApplication().invokeLater {
                // Execute JS to update content
                browser.cefBrowser.executeJavaScript(
                    "updateContent(`$escapedContent`);",
                    browser.cefBrowser.url,
                    0
                )
            }
        }
    }

    private fun escapeForJs(content: String): String {
        return content
            .replace("\\", "\\\\")
            .replace("`", "\\`")
            .replace("\$", "\\\$")
            .replace("\r\n", "\n")
            .replace("\r", "\n")
    }

    private fun createPreviewHtml(initialContent: String, isDark: Boolean): String {
        val themeClass = if (isDark) "dark" else "light"
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            color: #333;
            background: #fff;
        }
        body.dark {
            background: #1e1e1e;
            color: #d4d4d4;
        }
        body.dark a { color: #6db3f2; }
        body.dark code, body.dark pre { background: #2d2d2d; }
        body.dark blockquote { border-color: #444; color: #aaa; }
        body.dark table, body.dark th, body.dark td { border-color: #444; }
        body.dark th { background: #2d2d2d; }
        body.dark hr { border-color: #444; }
        body.dark h1 { color: #e0e0e0; border-bottom-color: #6db3f2; }
        body.dark h2 { color: #c0c0c0; border-bottom-color: #444; }
        body.dark h3, body.dark h4, body.dark h5, body.dark h6 { color: #a0a0a0; }
        body.dark mark { background: #5a5000; color: #fff; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-top: 0; }
        h2 { color: #34495e; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }
        h3, h4, h5, h6 { color: #7f8c8d; }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
            font-size: 0.9em;
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
            margin: 1em 0;
            padding: 0.5em 0 0.5em 20px;
            color: #666;
        }
        blockquote p { margin: 0; }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
        }
        th { background: #f8f9fa; font-weight: 600; }
        mark { background: #fff3cd; padding: 2px 4px; border-radius: 2px; }
        del { color: #dc3545; text-decoration: line-through; }
        ins { color: #28a745; text-decoration: none; border-bottom: 1px solid #28a745; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
        img { max-width: 100%; height: auto; }
        hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
        ul, ol { padding-left: 2em; }
        li { margin: 0.25em 0; }
        .task-list-item { list-style: none; margin-left: -1.5em; }
        .task-list-item input { margin-right: 0.5em; }
        sup, sub { font-size: 0.75em; }
        dt { font-weight: bold; margin-top: 1em; }
        dd { margin-left: 2em; }
        .footnote-ref { font-size: 0.75em; vertical-align: super; }
        .footnotes { border-top: 1px solid #ddd; margin-top: 2em; padding-top: 1em; font-size: 0.9em; }
        .math { font-family: 'Times New Roman', serif; font-style: italic; }
        #content { min-height: 100px; }
        #error { color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 5px; display: none; }
        #loading { color: #666; font-style: italic; }
        body.dark #error { background: #5a2d2d; color: #f8d7da; }
        body.dark #loading { color: #aaa; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/@djot/djot@0.3.1/dist/djot.min.js"></script>
</head>
<body class="$themeClass">
    <div id="error"></div>
    <div id="content"><div id="loading">Loading...</div></div>
    <script>
        function updateContent(djotSource) {
            const contentEl = document.getElementById('content');
            const errorEl = document.getElementById('error');

            try {
                errorEl.style.display = 'none';

                if (typeof djot === 'undefined') {
                    // Fallback if djot.js not loaded
                    contentEl.innerHTML = fallbackRender(djotSource);
                    return;
                }

                const doc = djot.parse(djotSource);
                const html = djot.renderHTML(doc);
                contentEl.innerHTML = html;
            } catch (e) {
                errorEl.textContent = 'Render error: ' + e.message;
                errorEl.style.display = 'block';
                // Try fallback
                contentEl.innerHTML = fallbackRender(djotSource);
            }
        }

        function fallbackRender(source) {
            // Very basic fallback renderer
            return source
                .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
                .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
                .replace(/_([^_]+)_/g, '<em>$1</em>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\{=([^=]+)=\}/g, '<mark>$1</mark>')
                .replace(/\{\+([^+]+)\+\}/g, '<ins>$1</ins>')
                .replace(/\{-([^-]+)-\}/g, '<del>$1</del>')
                .replace(/^- (.+)$/gm, '<li>$1</li>')
                .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
                .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
                .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
                .replace(/\n\n/g, '</p><p>')
                .replace(/^(?!<[hublioap])/gm, '<p>')
                .replace(/(?<![>])$/gm, '</p>')
                .replace(/<p><\/p>/g, '')
                .replace(/<p>(<[hubloi])/g, '$1')
                .replace(/(<\/[hubloi][^>]*>)<\/p>/g, '$1');
        }

        // Initial render
        document.addEventListener('DOMContentLoaded', function() {
            updateContent(`$initialContent`);
        });

        // Also try immediately in case DOMContentLoaded already fired
        if (document.readyState !== 'loading') {
            updateContent(`$initialContent`);
        }
    </script>
</body>
</html>
        """.trimIndent()
    }

    override fun dispose() {
        updateTimer.stop()
        browser.dispose()
    }
}
