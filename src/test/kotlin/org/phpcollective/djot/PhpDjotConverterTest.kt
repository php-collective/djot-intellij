package org.phpcollective.djot

import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import java.io.File

class PhpDjotConverterTest {

    private val testDir = "/tmp/djot-test"

    @Before
    fun setUp() {
        // Skip tests if PHP is not available or php-collective/djot is not installed
        val phpAvailable = try {
            ProcessBuilder("php", "-v").start().waitFor() == 0
        } catch (e: Exception) {
            false
        }
        assumeTrue("PHP not available", phpAvailable)

        val vendorExists = File("$testDir/vendor/autoload.php").exists()
        assumeTrue("php-collective/djot not installed in $testDir", vendorExists)
    }

    @Test
    fun testBasicConversion() {
        val djot = "# Hello World\n\nThis is *bold* and _italic_."
        val result = PhpDjotConverter.toHtml(
            djot = djot,
            workingDir = testDir,
        )

        assertTrue("Conversion should succeed", result.isSuccess)
        val html = result.getOrThrow()
        assertTrue("Should contain h1", html.contains("<h1>"))
        assertTrue("Should contain strong", html.contains("<strong>bold</strong>"))
        assertTrue("Should contain em", html.contains("<em>italic</em>"))
    }

    @Test
    fun testTableConversion() {
        val djot = """
            | Header 1 | Header 2 |
            |----------|----------|
            | Cell 1   | Cell 2   |
        """.trimIndent()

        val result = PhpDjotConverter.toHtml(
            djot = djot,
            workingDir = testDir,
        )

        assertTrue("Conversion should succeed", result.isSuccess)
        val html = result.getOrThrow()
        assertTrue("Should contain table", html.contains("<table"))
        assertTrue("Should contain th", html.contains("<th>"))
        assertTrue("Should contain td", html.contains("<td>"))
    }

    @Test
    fun testInlineFormatting() {
        val djot = """
            *Strong* _Emphasized_ {=Highlighted=} {+Inserted+} {-Deleted-}
        """.trimIndent()

        val result = PhpDjotConverter.toHtml(
            djot = djot,
            workingDir = testDir,
        )

        assertTrue("Conversion should succeed", result.isSuccess)
        val html = result.getOrThrow()
        assertTrue("Should contain strong", html.contains("<strong>Strong</strong>"))
        assertTrue("Should contain em", html.contains("<em>Emphasized</em>"))
        assertTrue("Should contain mark", html.contains("<mark>Highlighted</mark>"))
        assertTrue("Should contain ins", html.contains("<ins>Inserted</ins>"))
        assertTrue("Should contain del", html.contains("<del>Deleted</del>"))
    }

    @Test
    fun testCodeBlock() {
        val djot = """
            ```kotlin
            fun main() {
                println("Hello")
            }
            ```
        """.trimIndent()

        val result = PhpDjotConverter.toHtml(
            djot = djot,
            workingDir = testDir,
        )

        assertTrue("Conversion should succeed", result.isSuccess)
        val html = result.getOrThrow()
        assertTrue("Should contain pre", html.contains("<pre"))
        assertTrue("Should contain code", html.contains("<code"))
    }

    @Test
    fun testInvalidWorkingDir() {
        val djot = "# Test"
        val result = PhpDjotConverter.toHtml(
            djot = djot,
            workingDir = "/nonexistent/path",
        )

        assertTrue("Should fail with invalid working dir", result.isFailure)
    }

    @Test
    fun testFallbackToInlineWhenCliFails() {
        // Build a project where vendor/bin/djot exists but exits non-zero (e.g. a
        // PHP build without ext-posix), while the autoload is wired up so the
        // inline converter still works. The CLI is preferred, fails, and the
        // converter must fall back to the inline script instead of erroring.
        val project = File.createTempFile("djot-fallback", "").let {
            it.delete(); it.mkdirs(); it
        }
        val bin = File(project, "vendor/bin").apply { mkdirs() }
        val stub = File(bin, "djot")
        stub.writeText("#!/usr/bin/env php\n<?php\nfwrite(STDERR, \"boom\\n\");\nexit(255);\n")
        stub.setExecutable(true)
        java.nio.file.Files.createSymbolicLink(
            File(project, "vendor/autoload.php").toPath(),
            File("$testDir/vendor/autoload.php").toPath(),
        )

        try {
            val result = PhpDjotConverter.toHtml(
                djot = "# Hi\n\n*bold*",
                workingDir = project.absolutePath,
            )

            assertTrue("Should succeed via inline fallback", result.isSuccess)
            assertTrue("Should contain strong", result.getOrThrow().contains("<strong>bold</strong>"))
        } finally {
            project.deleteRecursively()
        }
    }

    @Test
    fun testMisconfiguredScriptFailsInsteadOfFallingBack() {
        // A non-empty but invalid custom script path is an explicit misconfiguration
        // and must surface as an error, not silently fall back to another converter.
        val result = PhpDjotConverter.toHtml(
            djot = "# Test",
            scriptPath = "/nonexistent/converter.php",
            workingDir = testDir,
        )

        assertTrue("Should fail on invalid custom script", result.isFailure)
    }
}
