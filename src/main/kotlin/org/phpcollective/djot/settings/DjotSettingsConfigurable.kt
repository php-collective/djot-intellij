package org.phpcollective.djot.settings

import com.intellij.ide.BrowserUtil
import com.intellij.openapi.fileChooser.FileChooserDescriptorFactory
import com.intellij.openapi.options.BoundConfigurable
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.DialogPanel
import com.intellij.ui.dsl.builder.*

class DjotSettingsConfigurable(private val project: Project) : BoundConfigurable("Djot") {

    private val settings get() = DjotSettings.getInstance(project)

    override fun createPanel(): DialogPanel {
        return panel {
            buttonsGroup("Renderer:") {
                row {
                    radioButton("djot.js (JavaScript via GraalJS)", DjotRenderer.DJOT_JS)
                        .comment("Default renderer, no additional dependencies required")
                }
                row {
                    radioButton("php-djot (PHP CLI)", DjotRenderer.DJOT_PHP)
                        .comment("Requires php-collective/djot installed in project")
                }
            }.bind(settings::renderer)

            group("PHP Settings") {
                row {
                    text("Requires <a href=\"https://github.com/php-collective/djot\">php-collective/djot</a> " +
                        "installed via Composer in your project:")
                        .applyToComponent {
                            addHyperlinkListener { e ->
                                if (e.eventType == javax.swing.event.HyperlinkEvent.EventType.ACTIVATED) {
                                    BrowserUtil.browse(e.url)
                                }
                            }
                        }
                }
                row {
                    text("<code>composer require php-collective/djot</code>")
                }
                row("PHP executable:") {
                    textFieldWithBrowseButton(
                        "Select PHP Executable",
                        project,
                        FileChooserDescriptorFactory.createSingleFileDescriptor()
                    ).columns(COLUMNS_LARGE)
                        .bindText(settings::phpPath)
                        .comment("Path to PHP binary (default: php)")
                }
                row("Converter script:") {
                    textFieldWithBrowseButton(
                        "Select Djot Script",
                        project,
                        FileChooserDescriptorFactory.createSingleFileDescriptor("php")
                    ).columns(COLUMNS_LARGE)
                        .bindText(settings::phpDjotScript)
                        .comment("Custom PHP script that reads stdin and outputs HTML. Leave empty to use built-in script.")
                }
            }
        }
    }
}
