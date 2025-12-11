package org.phpcollective.djot.settings

import com.intellij.openapi.components.*
import com.intellij.openapi.project.Project

enum class DjotRenderer {
    DJOT_JS,
    DJOT_PHP
}

@State(
    name = "DjotSettings",
    storages = [Storage("djot.xml")]
)
@Service(Service.Level.PROJECT)
class DjotSettings : PersistentStateComponent<DjotSettings.State> {

    data class State(
        var renderer: DjotRenderer = DjotRenderer.DJOT_JS,
        var phpPath: String = "php",
        var phpDjotScript: String = "",
    )

    private var state = State()

    override fun getState(): State = state

    override fun loadState(state: State) {
        this.state = state
    }

    var renderer: DjotRenderer
        get() = state.renderer
        set(value) { state.renderer = value }

    var phpPath: String
        get() = state.phpPath
        set(value) { state.phpPath = value }

    var phpDjotScript: String
        get() = state.phpDjotScript
        set(value) { state.phpDjotScript = value }

    companion object {
        fun getInstance(project: Project): DjotSettings =
            project.getService(DjotSettings::class.java)
    }
}
