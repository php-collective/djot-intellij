plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "1.9.21"
    id("org.jetbrains.intellij.platform") version "2.2.1"
}

group = "org.phpcollective"
version = "1.0.0"

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        phpstorm("2024.3")
        bundledPlugin("com.intellij.modules.textmate")
        instrumentationTools()
    }
}

kotlin {
    jvmToolchain(17)
}

intellijPlatform {
    pluginConfiguration {
        id = "org.phpcollective.djot"
        name = "Djot"
        version = project.version.toString()
        description = """
            Djot markup language support for JetBrains IDEs.

            Features:
            - Syntax highlighting
            - Live preview
            - Export to HTML
        """.trimIndent()
        vendor {
            name = "PHP Collective"
            url = "https://github.com/php-collective"
        }
        ideaVersion {
            sinceBuild = "243"
        }
    }
}

tasks {
    buildSearchableOptions {
        enabled = false
    }
}
