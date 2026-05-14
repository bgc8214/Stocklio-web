import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
XLSX = Path("/private/tmp/stock-portfolio-export.xlsx")


spec = importlib.util.spec_from_file_location("migrate_numbers", ROOT / "scripts" / "migrate_numbers.py")
migrate_numbers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(migrate_numbers)


class MigrationTest(unittest.TestCase):
    def test_numbers_export_migrates_to_valid_state(self):
        state, summary = migrate_numbers.migrate_workbook(XLSX)

        self.assertEqual(state["version"], 6)
        self.assertGreaterEqual(summary["holdings"], 20)
        self.assertGreaterEqual(summary["snapshots"], 30)
        self.assertGreaterEqual(summary["cashBalances"], 1)
        self.assertGreaterEqual(len(state["accounts"]), 5)
        self.assertGreaterEqual(len(state["dashboardLayout"]), 8)
        self.assertIn("KRW", summary["currencies"])
        self.assertIn("USD", summary["currencies"])
        self.assertTrue(summary["sourceRowsReconciled"])
        self.assertNotEqual(summary["summarySheetDiffKrw"], 0)
        self.assertGreater(summary["migratedTotalAssetsKrw"], summary["migratedHoldingsTotalKrw"])

    def test_migration_skips_total_rows_and_preserves_snapshot_order(self):
        state, _summary = migrate_numbers.migrate_workbook(XLSX)

        self.assertTrue(all(holding["name"] != "합계" for holding in state["holdings"]))
        self.assertTrue(all(holding["quantity"] > 0 for holding in state["holdings"]))

        dates = [snapshot["date"] for snapshot in state["portfolioSnapshots"]]
        self.assertEqual(dates, sorted(dates))
        self.assertEqual(len(dates), len(set(dates)))

    def test_imported_holdings_have_automation_boundary(self):
        state, _summary = migrate_numbers.migrate_workbook(XLSX)

        auto = [holding for holding in state["holdings"] if holding.get("autoPrice") is not False]
        manual = [holding for holding in state["holdings"] if holding.get("autoPrice") is False]

        self.assertTrue(auto)
        self.assertTrue(manual)
        self.assertTrue(all(holding["ticker"] for holding in auto))
        self.assertTrue(all(holding["priceSource"] == "Numbers import" for holding in manual))


if __name__ == "__main__":
    unittest.main()
