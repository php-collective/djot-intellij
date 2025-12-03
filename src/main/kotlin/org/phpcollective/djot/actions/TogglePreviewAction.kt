package org.phpcollective.djot.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.wm.ToolWindowManager
import org.phpcollective.djot.DjotFileType

class TogglePreviewAction : AnAction() {

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val toolWindow = ToolWindowManager.getInstance(project).getToolWindow("Djot Preview")

        toolWindow?.let {
            if (it.isVisible) {
                it.hide()
            } else {
                it.show()
            }
        }
    }

    override fun update(e: AnActionEvent) {
        val file = e.getData(CommonDataKeys.VIRTUAL_FILE)
        e.presentation.isEnabledAndVisible = file?.extension == DjotFileType.defaultExtension
    }
}
