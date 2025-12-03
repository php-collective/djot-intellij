package org.phpcollective.djot.preview

import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.FileEditorManagerListener
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory
import org.phpcollective.djot.DjotFileType
import javax.swing.JLabel
import javax.swing.JPanel
import java.awt.BorderLayout

class DjotPreviewToolWindowFactory : ToolWindowFactory, DumbAware {

    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val contentFactory = ContentFactory.getInstance()

        // Create placeholder panel
        val placeholderPanel = JPanel(BorderLayout()).apply {
            add(JLabel("Open a .djot file to see preview", JLabel.CENTER), BorderLayout.CENTER)
        }

        val content = contentFactory.createContent(placeholderPanel, "", false)
        toolWindow.contentManager.addContent(content)

        // Listen for file changes to update preview
        project.messageBus.connect().subscribe(
            FileEditorManagerListener.FILE_EDITOR_MANAGER,
            object : FileEditorManagerListener {
                override fun fileOpened(source: FileEditorManager, file: VirtualFile) {
                    if (file.extension == DjotFileType.defaultExtension) {
                        updatePreview(project, toolWindow, file)
                    }
                }

                override fun selectionChanged(event: com.intellij.openapi.fileEditor.FileEditorManagerEvent) {
                    val file = event.newFile
                    if (file != null && file.extension == DjotFileType.defaultExtension) {
                        updatePreview(project, toolWindow, file)
                    }
                }
            }
        )

        // Check if a djot file is already open
        FileEditorManager.getInstance(project).selectedFiles.firstOrNull {
            it.extension == DjotFileType.defaultExtension
        }?.let {
            updatePreview(project, toolWindow, it)
        }
    }

    private fun updatePreview(project: Project, toolWindow: ToolWindow, file: VirtualFile) {
        val contentManager = toolWindow.contentManager
        contentManager.removeAllContents(true)

        val previewPanel = DjotPreviewPanel(project, file)
        val content = ContentFactory.getInstance().createContent(
            previewPanel.component,
            file.name,
            false
        )
        contentManager.addContent(content)
    }

    override fun shouldBeAvailable(project: Project): Boolean = true
}
