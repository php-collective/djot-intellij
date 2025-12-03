package org.phpcollective.djot.preview

import com.intellij.openapi.fileEditor.*
import com.intellij.openapi.fileEditor.impl.text.TextEditorProvider
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import org.phpcollective.djot.DjotFileType

class DjotPreviewEditorProvider : FileEditorProvider, DumbAware {

    override fun accept(project: Project, file: VirtualFile): Boolean {
        return file.extension == DjotFileType.defaultExtension
    }

    override fun createEditor(project: Project, file: VirtualFile): FileEditor {
        return DjotSplitEditor(
            TextEditorProvider.getInstance().createEditor(project, file) as TextEditor,
            DjotPreviewFileEditor(project, file)
        )
    }

    override fun getEditorTypeId(): String = "djot-preview-editor"

    override fun getPolicy(): FileEditorPolicy = FileEditorPolicy.HIDE_DEFAULT_EDITOR
}

class DjotPreviewFileEditor(
    private val project: Project,
    private val file: VirtualFile
) : FileEditor {

    private val previewPanel = DjotPreviewPanel(project, file)

    override fun getComponent() = previewPanel.component

    override fun getPreferredFocusedComponent() = previewPanel.component

    override fun getName(): String = "Djot Preview"

    override fun setState(state: FileEditorState) {}

    override fun isModified(): Boolean = false

    override fun isValid(): Boolean = file.isValid

    override fun addPropertyChangeListener(listener: java.beans.PropertyChangeListener) {}

    override fun removePropertyChangeListener(listener: java.beans.PropertyChangeListener) {}

    override fun dispose() {
        previewPanel.dispose()
    }

    override fun getFile(): VirtualFile = file
}
