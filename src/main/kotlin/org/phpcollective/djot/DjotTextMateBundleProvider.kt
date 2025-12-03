package org.phpcollective.djot

import org.jetbrains.plugins.textmate.api.TextMateBundleProvider
import org.jetbrains.plugins.textmate.api.TextMateBundle

class DjotTextMateBundleProvider : TextMateBundleProvider {
    override fun getBundles(): List<TextMateBundle> {
        val bundlePath = this::class.java.classLoader.getResource("textmate")
        return if (bundlePath != null) {
            listOf(TextMateBundle("Djot", bundlePath.path))
        } else {
            emptyList()
        }
    }
}
