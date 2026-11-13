import importlib.util
import json
import re
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "build_lessons", ROOT / "scripts" / "build_lessons.py"
)
build_lessons = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = build_lessons
SPEC.loader.exec_module(build_lessons)


class LessonSiteTests(unittest.TestCase):
    def test_technique_atlas_covers_source_catalog(self):
        techniques = build_lessons.parse_techniques()
        self.assertGreaterEqual(len(techniques), 100)
        self.assertEqual(
            {item["category"] for item in techniques},
            {"knowledge", "retrieval", "agents", "evaluation", "security"},
        )
        for item in techniques:
            self.assertTrue(item["name"])
            self.assertTrue(item["source"])
            self.assertTrue(item["flow"])
            self.assertRegex(item["maturity"], r"^(Implemented|Blueprint|Experimental)")

    def test_all_pages_and_local_references_validate(self):
        techniques = build_lessons.parse_techniques()
        self.assertEqual(build_lessons.validate_site(len(techniques)), [])

    def test_generated_atlas_matches_parser(self):
        techniques = build_lessons.parse_techniques()
        data_path = ROOT / "kb_lessions" / "assets" / "techniques-data.js"
        text = data_path.read_text(encoding="utf-8")
        match = re.search(r"window\.KB_TECHNIQUES = (\[.*?\]);\s*window\.KB_LESSON_BUILD", text, re.S)
        self.assertIsNotNone(match)
        generated = json.loads(match.group(1))
        self.assertEqual(generated, techniques)

    def test_lessons_cover_core_system_flows(self):
        expected = {
            "01-foundations.html": ["canonical", "bitemporal", "promotion"],
            "02-retrieval-rag.html": ["BM25", "RRF", "GraphRAG"],
            "03-agent-orchestration.html": ["Dependency DAG", "write_set", "Shared context"],
            "04-bmad-delivery.html": ["Direct", "Readiness", "retrospective"],
            "05-governance-evals.html": ["Trust model", "Holdout", "Canary"],
            "06-end-to-end.html": ["Knowledge Q&amp;A", "Change delivery", "Learn &amp; promote"],
            "07-hands-on-labs.html": ["scripts/kb.py validate", "compile-fanout", "http.server"],
        }
        for filename, needles in expected.items():
            text = (ROOT / "kb_lessions" / filename).read_text(encoding="utf-8")
            for needle in needles:
                self.assertIn(needle, text, f"{filename} should explain {needle}")


if __name__ == "__main__":
    unittest.main()
