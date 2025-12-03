package org.phpcollective.djot

import com.intellij.lang.ASTNode
import com.intellij.lang.ParserDefinition
import com.intellij.lang.PsiParser
import com.intellij.lexer.EmptyLexer
import com.intellij.lexer.Lexer
import com.intellij.openapi.project.Project
import com.intellij.psi.FileViewProvider
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiFile
import com.intellij.psi.tree.IFileElementType
import com.intellij.psi.tree.TokenSet

/**
 * Minimal parser definition for Djot files.
 * Actual syntax highlighting is provided by TextMate grammar.
 */
class DjotParserDefinition : ParserDefinition {

    companion object {
        val FILE = IFileElementType(DjotLanguage)
    }

    override fun createLexer(project: Project?): Lexer = EmptyLexer()

    override fun createParser(project: Project?): PsiParser {
        return PsiParser { root, _ ->
            root.mark().done(FILE)
            root.treeBuilt
        }
    }

    override fun getFileNodeType(): IFileElementType = FILE

    override fun getCommentTokens(): TokenSet = TokenSet.EMPTY

    override fun getStringLiteralElements(): TokenSet = TokenSet.EMPTY

    override fun createElement(node: ASTNode?): PsiElement {
        throw UnsupportedOperationException("Not implemented")
    }

    override fun createFile(viewProvider: FileViewProvider): PsiFile {
        return DjotFile(viewProvider)
    }
}
