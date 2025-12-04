plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "1.9.21"
    id("org.jetbrains.intellij") version "1.17.4"
}

group = "org.phpcollective"
version = "1.0.1"

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

tasks {
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
