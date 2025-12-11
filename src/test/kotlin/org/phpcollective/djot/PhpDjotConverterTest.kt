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
}
