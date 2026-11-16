"""Matematica de fatores simples; sem dados de mercado ou regras tributarias."""
from __future__ import annotations

import argparse
import json
from decimal import Decimal, InvalidOperation, localcontext
from pathlib import Path

ONE = Decimal("1")
ZERO = Decimal("0")


def number(value, name: str) -> Decimal:
    if isinstance(value, bool):
        raise ValueError(f"{name}: booleano nao e numero")
    try:
        result = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ValueError(f"{name}: numero decimal invalido") from exc
    if not result.is_finite():
        raise ValueError(f"{name}: numero deve ser finito")
    return result


def fixed_factor(rate, year_fraction) -> Decimal:
    rate = number(rate, "rate")
    term = number(year_fraction, "year_fraction")
    if rate <= -ONE or term <= ZERO:
        raise ValueError("rate deve ser maior que -1 e year_fraction positivo")
    with localcontext() as ctx:
        ctx.prec = 40
        return (ONE + rate) ** term


def indexed_factor(daily_rates, multiplier) -> Decimal:
    if not isinstance(daily_rates, list) or not daily_rates:
        raise ValueError("daily_rates deve ser lista nao vazia de taxas efetivas")
    part = number(multiplier, "multiplier")
    if part < ZERO:
        raise ValueError("multiplier deve ser nao negativo")
    with localcontext() as ctx:
        ctx.prec = 40
        factor = ONE
        for i, raw_rate in enumerate(daily_rates):
            rate = number(raw_rate, f"daily_rates[{i}]")
            if rate <= -ONE or ONE + rate * part <= ZERO:
                raise ValueError("fator diario deve ser positivo")
            factor *= ONE + rate * part
        return +factor


def tax(value) -> Decimal:
    value = number(value, "tax_rate")
    if not ZERO <= value < ONE:
        raise ValueError("tax_rate deve estar entre 0 inclusive e 1 exclusive")
    return value


def net_factor(gross_factor, tax_rate) -> Decimal:
    gross = number(gross_factor, "gross_factor")
    rate = tax(tax_rate)
    if gross <= ZERO:
        raise ValueError("gross_factor deve ser positivo")
    with localcontext() as ctx:
        ctx.prec = 40
        gain = gross - ONE
        return ONE + max(gain, ZERO) * (ONE - rate) + min(gain, ZERO)


def equivalent_rate(target_net_factor, tax_rate, year_fraction) -> Decimal:
    target = number(target_net_factor, "target_net_factor")
    rate = tax(tax_rate)
    term = number(year_fraction, "year_fraction")
    if target < ONE or term <= ZERO:
        raise ValueError("target_net_factor deve ser >= 1 e prazo positivo")
    with localcontext() as ctx:
        ctx.prec = 40
        gross = ONE + (target - ONE) / (ONE - rate)
        return gross ** (ONE / term) - ONE


OPERATIONS = {
    "fixed": (fixed_factor, {"rate", "year_fraction"}, "gross_factor"),
    "indexed": (indexed_factor, {"daily_rates", "multiplier"}, "gross_factor"),
    "net": (net_factor, {"gross_factor", "tax_rate"}, "net_factor"),
    "equivalent": (
        equivalent_rate,
        {"target_net_factor", "tax_rate", "year_fraction"},
        "equivalent_effective_rate",
    ),
}


def evaluate(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("entrada deve ser objeto JSON")
    operation = payload.get("operation")
    if not isinstance(operation, str) or operation not in OPERATIONS:
        raise ValueError("operation deve ser fixed, indexed, net ou equivalent")
    function, fields, result_key = OPERATIONS[operation]
    provided = set(payload) - {"operation"}
    if provided != fields:
        raise ValueError(
            f"campos obrigatorios: {sorted(fields)}; "
            f"recebidos: {sorted(provided)}"
        )
    result = function(**{field: payload[field] for field in fields})
    return {
        "operation": operation,
        result_key: str(result),
        "conditions": (
            "Calculo matematico sob entradas declaradas; sem previsao. "
            "Calendario, arredondamento contratual, custos, IOF, cupons, "
            "amortizacoes e regras fiscais nao sao inferidos. "
            "net/equivalent assumem imposto unico sobre ganho positivo no resgate."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args()
    try:
        payload = json.loads(
            args.input.read_text(encoding="utf-8-sig"),
            parse_float=Decimal,
        )
        result = evaluate(payload)
    except (OSError, ValueError, InvalidOperation) as exc:
        parser.exit(2, f"Erro: {exc}\n")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
