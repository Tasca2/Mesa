"""Casos sinteticos; testar matematica, nao vigencia de norma ou contrato."""
import unittest
from decimal import Decimal, localcontext

from calculos import (
    equivalent_rate,
    evaluate,
    fixed_factor,
    indexed_factor,
    net_factor,
)


class FactorTests(unittest.TestCase):
    def assertClose(self, value, expected, epsilon=Decimal("1e-25")):
        self.assertLess(abs(value - Decimal(expected)), epsilon)

    def test_compounding(self):
        self.assertEqual(fixed_factor("0.10", "2"), Decimal("1.21"))

    def test_fractional_year(self):
        self.assertClose(fixed_factor("0.21", "0.5"), "1.1")

    def test_daily_compounding(self):
        self.assertEqual(
            indexed_factor(["0.01", "0.02"], "1.1"),
            Decimal("1.033242"),
        )

    def test_daily_is_not_annual_multiplier(self):
        actual = indexed_factor(["0.01", "0.01"], "1.1")
        naive = Decimal("1") + (Decimal("1.01") ** 2 - 1) * Decimal("1.1")
        self.assertNotEqual(actual, naive)

    def test_tax_positive_gain(self):
        self.assertEqual(net_factor("1.21", "0.20"), Decimal("1.168"))

    def test_loss_does_not_create_tax_credit(self):
        self.assertEqual(net_factor("0.9", "0.20"), Decimal("0.9"))

    def test_zero_tax_and_zero_gain(self):
        self.assertEqual(net_factor("1.21", "0"), Decimal("1.21"))
        self.assertEqual(net_factor("1", "0.2"), Decimal("1"))

    def test_equivalence_roundtrip(self):
        with localcontext() as ctx:
            ctx.prec = 40
            result = equivalent_rate("1.21", "0.2", "2")
            net = net_factor(fixed_factor(result, "2"), "0.2")
            self.assertClose(net, "1.21")
            self.assertNotEqual(result, Decimal("0.10") / Decimal("0.8"))

    def test_equivalence_one_year(self):
        self.assertClose(equivalent_rate("1.10", "0.2", "1"), "0.125")

    def test_invalid_inputs(self):
        for function, arguments in [
            (fixed_factor, ("-1", "1")),
            (fixed_factor, ("0.1", "0")),
            (fixed_factor, ("NaN", "1")),
            (fixed_factor, (True, "1")),
            (indexed_factor, ([], "1")),
            (indexed_factor, (["-0.8"], "2")),
            (net_factor, ("1.1", "1")),
            (net_factor, ("0", "0.2")),
            (equivalent_rate, ("0.9", "0.2", "1")),
        ]:
            with self.subTest(function=function.__name__, arguments=arguments):
                with self.assertRaises(ValueError):
                    function(*arguments)

    def test_unsupported_cost_is_rejected(self):
        with self.assertRaises(ValueError):
            evaluate({
                "operation": "net",
                "gross_factor": "1.2",
                "tax_rate": "0.2",
                "fee": "0.01",
            })

    def test_serializable_result_and_invalid_operation(self):
        result = evaluate({
            "operation": "fixed",
            "rate": "0.1",
            "year_fraction": "2",
        })
        self.assertEqual(result["gross_factor"], "1.21")
        with self.assertRaises(ValueError):
            evaluate({"operation": []})


if __name__ == "__main__":
    unittest.main()
