package org.phpcollective.djot

import com.intellij.extapi.psi.PsiFileBase
import com.intellij.openapi.fileTypes.FileType
import com.intellij.psi.FileViewProvider

class DjotFile(viewProvider: FileViewProvider) : PsiFileBase(viewProvider, DjotLanguage) {

    override fun getFileType(): FileType = DjotFileType

    override fun toString(): String = "Djot File"
}
