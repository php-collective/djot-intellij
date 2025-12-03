package org.phpcollective.djot

import com.intellij.openapi.fileTypes.LanguageFileType
import javax.swing.Icon

object DjotFileType : LanguageFileType(DjotLanguage) {
    override fun getName(): String = "Djot"
    override fun getDescription(): String = "Djot markup file"
    override fun getDefaultExtension(): String = "djot"
    override fun getIcon(): Icon? = DjotIcons.FILE

    const val INSTANCE_NAME = "Djot"
}
