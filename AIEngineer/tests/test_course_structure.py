"""Contract tests cho cấu trúc giáo trình."""

from __future__ import annotations

import importlib.util
import ast
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class CourseStructureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads((ROOT / "course_manifest.json").read_text(encoding="utf-8"))

    def test_ids_are_sorted_and_unique(self) -> None:
        ids = [item["id"] for item in self.manifest["lessons"]]
        self.assertEqual(ids, [f"{value:02}" for value in range(51)])
        self.assertEqual(len(ids), len(set(ids)))

    def test_prerequisites_point_backward(self) -> None:
        for item in self.manifest["lessons"]:
            for prerequisite in item["prerequisites"]:
                self.assertLess(int(prerequisite), int(item["id"]), item)

    def test_every_lesson_has_readme_and_importable_demo(self) -> None:
        missing: list[str] = []
        for item in self.manifest["lessons"]:
            base = ROOT / "Lessions" / f"{item['id']}-{item['slug']}"
            readme = base / "README.md"
            demo = base / "src" / "demo.py"
            if not readme.is_file():
                missing.append(str(readme.relative_to(ROOT)))
            if not demo.is_file():
                missing.append(str(demo.relative_to(ROOT)))
                continue
            spec = importlib.util.spec_from_file_location(f"lesson_{item['id']}", demo)
            self.assertIsNotNone(spec)
            self.assertIsNotNone(spec.loader if spec else None)
        self.assertEqual(missing, [])

    def test_lessons_are_substantive_and_demos_self_check(self) -> None:
        for item in self.manifest["lessons"]:
            base = ROOT / "Lessions" / f"{item['id']}-{item['slug']}"
            readme = (base / "README.md").read_text(encoding="utf-8")
            demo_path = base / "src" / "demo.py"
            tree = ast.parse(demo_path.read_text(encoding="utf-8"), filename=str(demo_path), feature_version=(3, 11))
            functions = [node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]
            self.assertGreaterEqual(len(readme), 1_500, item["id"])
            self.assertIn("src/demo.py", readme.replace("\\", "/"), item["id"])
            self.assertGreaterEqual(len(functions), 2, item["id"])
            self.assertTrue(any(isinstance(node, ast.Assert) for node in ast.walk(tree)), item["id"])

    def test_quiz_bank_contract_and_coverage(self) -> None:
        bank = json.loads((ROOT / "Quiz" / "questions.json").read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(bank), 60)
        self.assertEqual(len({item["id"] for item in bank}), len(bank))
        self.assertEqual(
            {item["phase"] for item in bank},
            {"foundations", "machine-learning", "deep-learning-llm", "rag-agents", "reliability-production", "capstone-career"},
        )
        for item in bank:
            self.assertEqual(len(item["choices"]), 4, item["id"])
            self.assertIn(item["answer"], range(4), item["id"])


if __name__ == "__main__":
    unittest.main()
