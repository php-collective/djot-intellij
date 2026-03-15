plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "1.9.21"
    id("org.jetbrains.intellij") version "1.17.4"
}

group = "org.phpcollective"
version = "1.1.0"

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.graalvm.js:js:23.0.2")
    implementation("org.graalvm.js:js-scriptengine:23.0.2")
}

intellij {
    version.set("2024.1")
    type.set("PS") // PhpStorm
    updateSinceUntilBuild.set(false)
}

kotlin {
    jvmToolchain(17)
}

val textmateDir = "src/main/resources/textmate"
val grammarUrl = "https://raw.githubusercontent.com/php-collective/djot-grammars/master/textmate/djot.tmLanguage.json"

tasks {
    val downloadGrammar by registering {
        description = "Downloads the TextMate grammar from djot-grammars"
        group = "build"

        val outputFile = file("$textmateDir/djot.tmLanguage.json")
        outputs.file(outputFile)

        doLast {
            uri(grammarUrl).toURL().openStream().use { input ->
                outputFile.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
            println("Downloaded grammar to $outputFile")
        }
    }

    processResources {
        dependsOn(downloadGrammar)
    }

    patchPluginXml {
        sinceBuild.set("241")
    }

    buildSearchableOptions {
        enabled = false
    }

    publishPlugin {
        token.set(System.getenv("PUBLISH_TOKEN"))
    }
}
