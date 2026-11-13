import importlib.util
import json
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("kb_tool", ROOT / "scripts" / "kb.py")
kb_tool = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = kb_tool
SPEC.loader.exec_module(kb_tool)


class FrontmatterTests(unittest.TestCase):
    def test_parses_inline_lists_and_null(self):
        metadata, body = kb_tool.parse_frontmatter(
            "---\nid: demo.page\nowners: [team-a, team-b]\nvalid_to: null\n---\n# Body\n"
        )
        self.assertEqual(metadata["id"], "demo.page")
        self.assertEqual(metadata["owners"], ["team-a", "team-b"])
        self.assertIsNone(metadata["valid_to"])
        self.assertEqual(body, "# Body")


class WorkflowTests(unittest.TestCase):
    def node(self, node_id, dependencies=None, group=None, writes=None):
        return {
            "id": node_id,
            "skill": "study",
            "objective": "test node",
            "depends_on": dependencies or [],
            "execution": "read-only",
            "parallel_group": group,
            "read_set": ["kb/**"],
            "write_set": writes or [],
            "output": "report",
            "acceptance": ["has evidence"],
            "risk": "low",
            "approval": "none",
            "effects": {"resources": [], "side_effects": [], "idempotency_key": None, "exclusive_locks": []},
            "retry": {"max_attempts": 1, "transient_only": True},
        }

    def workflow(self, nodes):
        return {
            "schema_version": "1.0",
            "id": "test-workflow",
            "intent": "study",
            "owner": "manager",
            "budget": {"max_concurrency": 2, "max_retries_per_node": 1},
            "nodes": nodes,
        }

    def test_detects_cycle(self):
        data = self.workflow([self.node("a", ["b"]), self.node("b", ["a"])])
        errors = kb_tool.validate_workflow_data(data, "test", {"study"})
        self.assertTrue(any("cycle" in error for error in errors))

    def test_detects_parallel_write_conflict(self):
        data = self.workflow([
            self.node("a", group="wave", writes=["src/schema/**"]),
            self.node("b", group="wave", writes=["src/schema/events/**"]),
        ])
        errors = kb_tool.validate_workflow_data(data, "test", {"study"})
        self.assertTrue(any("write conflict" in error for error in errors))

    def test_allows_parallel_read_only_nodes(self):
        data = self.workflow([self.node("a", group="wave"), self.node("b", group="wave")])
        self.assertEqual(kb_tool.validate_workflow_data(data, "test", {"study"}), [])

    def test_rejects_dependency_related_nodes_in_same_parallel_group(self):
        data = self.workflow([
            self.node("a", group="wave"),
            self.node("b", dependencies=["a"], group="wave"),
        ])
        errors = kb_tool.validate_workflow_data(data, "test", {"study"})
        self.assertTrue(any("dependency-related" in error for error in errors))

    def test_rejects_invalid_budget_execution_approval_and_retry(self):
        node = self.node("a")
        node["execution"] = "magic"
        node["approval"] = "maybe"
        node["retry"] = {"max_attempts": 0, "transient_only": "yes"}
        data = self.workflow([node])
        data["budget"] = {"max_concurrency": 0, "max_retries_per_node": -1}
        errors = kb_tool.validate_workflow_data(data, "test", {"study"})
        self.assertTrue(any("max_concurrency" in error for error in errors))
        self.assertTrue(any("invalid execution" in error for error in errors))
        self.assertTrue(any("invalid approval" in error for error in errors))
        self.assertTrue(any("max_attempts" in error for error in errors))

    def test_detects_shared_mutable_external_resource(self):
        left = self.node("a", group="wave")
        right = self.node("b", group="wave")
        left["effects"] = {"resources": ["deployment-api"], "side_effects": ["deploy"], "idempotency_key": "deploy-a", "exclusive_locks": []}
        right["effects"] = {"resources": ["deployment-api"], "side_effects": ["deploy"], "idempotency_key": "deploy-b", "exclusive_locks": []}
        data = self.workflow([left, right])
        errors = kb_tool.validate_workflow_data(data, "test", {"study"})
        self.assertTrue(any("shared external resources" in error for error in errors))

    def test_retried_side_effect_requires_idempotency_key(self):
        node = self.node("a")
        node["effects"] = {"resources": ["ticket-api"], "side_effects": ["create-ticket"], "idempotency_key": None, "exclusive_locks": []}
        node["retry"] = {"max_attempts": 2, "transient_only": True}
        data = self.workflow([node])
        errors = kb_tool.validate_workflow_data(data, "test", {"study"})
        self.assertTrue(any("idempotency_key" in error for error in errors))

    def test_verifier_cannot_write(self):
        node = self.node("verify")
        node["skill"] = "verify-delivery"
        node["execution"] = "shared-workspace"
        node["write_set"] = ["kb/**"]
        data = self.workflow([node])
        errors = kb_tool.validate_workflow_data(data, "test", {"verify-delivery"})
        self.assertTrue(any("must execute read-only" in error for error in errors))
        self.assertTrue(any("cannot declare a write_set" in error for error in errors))

    def test_high_risk_human_approval_requires_authorities(self):
        node = self.node("approve")
        node["risk"] = "high"
        node["approval"] = "human"
        node["execution"] = "approval-gate"
        data = self.workflow([node])
        errors = kb_tool.validate_workflow_data(data, "test", {"study"})
        self.assertTrue(any("required_authorities" in error for error in errors))

    def test_fanout_rejects_unknown_subworkflow(self):
        node = self.node("fanout")
        node["fanout"] = {
            "source": "stories.json", "inventory_kind": "test", "items_field": "items", "item_id_field": "id", "dependency_field": "depends_on",
            "subworkflow": "missing-workflow", "completion": "all-accepted",
            "max_concurrency": 2, "instance_write_set_field": "write_set", "required_parameter_fields": [],
            "write_scope_parameter": "approved-write-scope", "allowed_locked_shared_write_set": [],
        }
        data = self.workflow([node])
        errors = kb_tool.validate_workflow_data(data, "test", {"study"}, {"test-workflow"})
        self.assertTrue(any("unknown subworkflow" in error for error in errors))

    def test_join_requires_dependency_on_fanout(self):
        fanout = self.node("fanout")
        fanout["fanout"] = {
            "source": "stories.json", "inventory_kind": "test", "items_field": "items", "item_id_field": "id", "dependency_field": "depends_on",
            "subworkflow": "test-workflow", "completion": "all-accepted",
            "max_concurrency": 2, "instance_write_set_field": "write_set", "required_parameter_fields": [],
            "write_scope_parameter": "approved-write-scope", "allowed_locked_shared_write_set": [],
        }
        join = self.node("join")
        join["join"] = {"fanout_node": "fanout", "require": "all-accepted", "allow_partial": False}
        data = self.workflow([fanout, join])
        errors = kb_tool.validate_workflow_data(data, "test", {"study"}, {"test-workflow"})
        self.assertTrue(any("must depend on fanout" in error for error in errors))

    def test_join_completion_must_match_fanout(self):
        fanout = self.node("fanout")
        fanout["fanout"] = {
            "source": "stories.json", "inventory_kind": "test", "items_field": "items", "item_id_field": "id", "dependency_field": "depends_on",
            "subworkflow": "test-workflow", "completion": "all-terminal",
            "max_concurrency": 2, "instance_write_set_field": "write_set", "required_parameter_fields": [],
            "write_scope_parameter": "approved-write-scope", "allowed_locked_shared_write_set": [],
        }
        join = self.node("join", dependencies=["fanout"])
        join["join"] = {"fanout_node": "fanout", "require": "all-accepted", "allow_partial": False}
        errors = kb_tool.validate_workflow_data(self.workflow([fanout, join]), "test", {"study"}, {"test-workflow"})
        self.assertTrue(any("completes as" in error for error in errors))

    def test_verifier_cannot_bypass_integration_join(self):
        fanout = self.node("fanout")
        fanout["fanout"] = {
            "source": "stories.json", "inventory_kind": "test", "items_field": "items", "item_id_field": "id", "dependency_field": "depends_on",
            "subworkflow": "test-workflow", "completion": "all-accepted",
            "max_concurrency": 2, "instance_write_set_field": "write_set", "required_parameter_fields": [],
            "write_scope_parameter": "approved-write-scope", "allowed_locked_shared_write_set": [],
        }
        join = self.node("integrate", dependencies=["fanout"])
        join["join"] = {"fanout_node": "fanout", "require": "all-accepted", "allow_partial": False}
        verifier = self.node("verify", dependencies=["fanout"])
        verifier["skill"] = "verify-delivery"
        errors = kb_tool.validate_workflow_data(
            self.workflow([fanout, join, verifier]), "test", {"study", "verify-delivery"}, {"test-workflow"}
        )
        self.assertTrue(any("bypasses integration join" in error for error in errors))

    def test_unknown_generic_approval_authority_is_rejected(self):
        node = self.node("approve")
        node.update({"risk": "high", "approval": "human", "execution": "approval-gate", "required_authorities": ["human"]})
        errors = kb_tool.validate_workflow_data(self.workflow([node]), "test", {"study"}, authority_names={"product-owner"})
        self.assertTrue(any("unknown approval authorities" in error for error in errors))

    def test_inventory_rejects_independent_write_overlap(self):
        fanout = {
            "inventory_kind": "test", "items_field": "items", "item_id_field": "id", "dependency_field": "depends_on",
            "instance_write_set_field": "write_set", "max_concurrency": 2, "subworkflow": "worker", "completion": "all-accepted",
            "required_parameter_fields": [], "write_scope_parameter": "approved-write-scope", "allowed_locked_shared_write_set": [],
        }
        inventory = {
            "schema_version": "1.0", "kind": "test", "items": [
                {"id": "a", "depends_on": [], "write_set": ["src/**"], "parameters": {}},
                {"id": "b", "depends_on": [], "write_set": ["src/api/**"], "parameters": {}},
            ],
        }
        errors = kb_tool.validate_work_item_inventory(inventory, "test", fanout)
        self.assertTrue(any("overlapping write_set" in error for error in errors))

    def test_inventory_requires_kind_and_runtime_bindings(self):
        fanout = {
            "inventory_kind": "test", "items_field": "items", "item_id_field": "id", "dependency_field": "depends_on",
            "instance_write_set_field": "write_set", "max_concurrency": 1, "subworkflow": "worker", "completion": "all-accepted",
            "required_parameter_fields": ["worktree"], "write_scope_parameter": "approved-write-scope", "allowed_locked_shared_write_set": [],
        }
        inventory = {
            "schema_version": "1.0",
            "items": [{"id": "a", "depends_on": [], "write_set": ["src/**"], "parameters": {}}],
        }
        errors = kb_tool.validate_work_item_inventory(inventory, "test", fanout)
        self.assertTrue(any("kind must be" in error for error in errors))
        self.assertTrue(any("missing required parameters" in error for error in errors))

    def test_inventory_must_cover_subworkflow_writes(self):
        fanout = {
            "inventory_kind": "test", "items_field": "items", "item_id_field": "id", "dependency_field": "depends_on",
            "instance_write_set_field": "write_set", "max_concurrency": 1, "subworkflow": "worker", "completion": "all-accepted",
            "required_parameter_fields": [], "write_scope_parameter": "approved-write-scope", "allowed_locked_shared_write_set": [],
        }
        inventory = {
            "schema_version": "1.0", "kind": "test",
            "items": [{"id": "a", "depends_on": [], "write_set": ["src/**"], "parameters": {}}],
        }
        writer = self.node("write-global", writes=["shared/global/**"])
        errors = kb_tool.validate_work_item_inventory(inventory, "test", fanout, self.workflow([writer]))
        self.assertTrue(any("outside item" in error for error in errors))


class SearchTests(unittest.TestCase):
    def test_title_and_summary_are_ranked(self):
        pages = [
            kb_tool.Page(Path("a.md"), {"id": "a", "title": "Graph retrieval", "summary": "GraphRAG for multi-hop questions", "tags": []}, "entities and relations"),
            kb_tool.Page(Path("b.md"), {"id": "b", "title": "Operations", "summary": "Deployment rollback", "tags": []}, "alerts and backups"),
        ]
        ranked = kb_tool.rank_pages("GraphRAG multi-hop", pages)
        self.assertEqual(ranked[0][1].metadata["id"], "a")


class RepositoryTests(unittest.TestCase):
    def test_repository_validates(self):
        errors, _warnings, pages = kb_tool.validate_repository(ROOT)
        self.assertGreaterEqual(len(pages), 5)
        self.assertEqual(errors, [])

    def test_jsonl_files_are_valid(self):
        for path in ROOT.rglob("*.jsonl"):
            for line in path.read_text(encoding="utf-8").splitlines():
                if line.strip():
                    json.loads(line)

    def test_bmad_adapter_and_paths_exist(self):
        self.assertTrue((ROOT / ".agents" / "skills" / "bmad-adapter" / "SKILL.md").exists())
        for name in ("bmad-quick.json", "bmad-story.json", "bmad-epic.json", "bmad-project.json"):
            self.assertTrue((ROOT / "orchestration" / "workflows" / name).exists())

    def test_bmad_verifiers_are_read_only(self):
        for path in (ROOT / "orchestration" / "workflows").glob("bmad-*.json"):
            workflow = json.loads(path.read_text(encoding="utf-8"))
            for node in workflow["nodes"]:
                if node["skill"] == "verify-delivery":
                    self.assertEqual(node["execution"], "read-only", f"{path.name}:{node['id']}")
                    self.assertEqual(node["write_set"], [], f"{path.name}:{node['id']}")

    def test_bmad_fanout_has_machine_checked_join_and_integration(self):
        epic = json.loads((ROOT / "orchestration" / "workflows" / "bmad-epic.json").read_text(encoding="utf-8"))
        project = json.loads((ROOT / "orchestration" / "workflows" / "bmad-project.json").read_text(encoding="utf-8"))
        epic_nodes = {node["id"]: node for node in epic["nodes"]}
        project_nodes = {node["id"]: node for node in project["nodes"]}
        self.assertEqual(epic_nodes["execute-stories"]["fanout"]["subworkflow"], "bmad-story")
        self.assertEqual(epic_nodes["integrate-stories"]["join"]["fanout_node"], "execute-stories")
        self.assertEqual(project_nodes["execute-epics"]["fanout"]["subworkflow"], "bmad-epic")
        self.assertEqual(project_nodes["integrate-epics"]["join"]["fanout_node"], "execute-epics")

    def test_story_inventory_compiles_to_an_accepted_subworkflow_wave(self):
        epic = json.loads((ROOT / "orchestration" / "workflows" / "bmad-epic.json").read_text(encoding="utf-8"))
        story = json.loads((ROOT / "orchestration" / "workflows" / "bmad-story.json").read_text(encoding="utf-8"))
        inventory = json.loads((ROOT / "kb" / "projects" / "_template" / "delivery" / "story-inventory.template.json").read_text(encoding="utf-8"))
        fanout = next(node["fanout"] for node in epic["nodes"] if node["id"] == "execute-stories")
        plan = kb_tool.compile_fanout_plan(inventory, fanout, story["completion_contract"])
        self.assertEqual(plan["subworkflow"], "bmad-story")
        self.assertEqual(plan["waves"][0][0]["instance_id"], "STORY-001")
        self.assertEqual(plan["waves"][0][0]["acceptance"]["accepted_values"], ["PASS"])

    def test_bmad_retrospectives_write_only_episodic_memory(self):
        for name in ("bmad-epic.json", "bmad-project.json"):
            workflow = json.loads((ROOT / "orchestration" / "workflows" / name).read_text(encoding="utf-8"))
            retrospective_nodes = [node for node in workflow["nodes"] if "retrospective" in node["id"]]
            self.assertTrue(retrospective_nodes, name)
            for node in retrospective_nodes:
                for write_pattern in node["write_set"]:
                    self.assertTrue(write_pattern.startswith("kb/memory/episodic/"), f"{name}:{node['id']}")

    def test_bmad_direct_bypass_is_documented(self):
        skill = (ROOT / ".agents" / "skills" / "bmad-adapter" / "SKILL.md").read_text(encoding="utf-8")
        self.assertIn("**direct:**", skill)
        self.assertIn("without a BMAD workflow", skill)

    def test_readme_explains_repository_directories(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("## Ý nghĩa từng thư mục", readme)
        for location in (".agents/skills/", "kb/shared/", "kb/memory/episodic/", "orchestration/workflows/", "governance/", "scripts/", "tests/"):
            self.assertIn(f"`{location}`", readme)

    def test_every_technique_has_a_source_location(self):
        lines = (ROOT / "TECHNIQUES.md").read_text(encoding="utf-8").splitlines()
        technique_rows = [
            line for line in lines
            if line.startswith("| ") and any(marker in line for marker in ("| Implemented |", "| Implemented as ", "| Blueprint |", "| Experimental |"))
        ]
        self.assertGreaterEqual(len(technique_rows), 90)
        for line in technique_rows:
            cells = [cell.strip() for cell in line.strip("|").split("|")]
            self.assertEqual(len(cells), 5, line)
            self.assertTrue(cells[3], line)
            self.assertIn("`", cells[3], line)


if __name__ == "__main__":
    unittest.main()
