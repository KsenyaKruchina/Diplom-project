from openpyxl import Workbook
from datetime import datetime
import math
import io
import os

# ReportLab imports
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, HRFlowable, PageBreak, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Matplotlib для графиков
import matplotlib
matplotlib.use("Agg")  # Без GUI — обязательно для серверной среды
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.patches import FancyBboxPatch
import numpy as np


# ──────────────────────────────────────────────────────────────────────────────
# УТИЛИТЫ
# ──────────────────────────────────────────────────────────────────────────────

def _register_font():
    """Регистрируем Arial с поддержкой кириллицы."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    font_path = os.path.join(current_dir, "arialmt.ttf")
    if not os.path.exists(font_path):
        raise FileNotFoundError(
            f"Файл шрифта не найден: {font_path}. "
            "Положите arialmt.ttf в папку app/services/"
        )
    if "Arial-Cyrillic" not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont("Arial-Cyrillic", font_path))
    return "Arial-Cyrillic"


def calculate_mkt(temperatures: list) -> float:
    """Среднекинетическая температура (MKT) по формуле Фармакопеи."""
    if not temperatures:
        return 0.0
    delta_h = 83144.0   # Дж/моль
    r = 8.3144          # Дж/(моль·К)
    n = len(temperatures)
    try:
        sum_exp = sum(math.exp(-delta_h / (r * (t + 273.15))) for t in temperatures)
        mkt = (delta_h / r) / (-math.log(sum_exp / n)) - 273.15
        return round(mkt, 2)
    except (ZeroDivisionError, ValueError):
        return 0.0


# ──────────────────────────────────────────────────────────────────────────────
# ГЕНЕРАТОРЫ ГРАФИКОВ (matplotlib → BytesIO → ReportLab Image)
# ──────────────────────────────────────────────────────────────────────────────

def _chart_temperature(measurements: list, width_cm: float = 16, height_cm: float = 7) -> io.BytesIO:
    """График температуры во времени с зонами норма/внимание/тревога."""
    timestamps = [m.timestamp for m in measurements]
    temps = [m.temperature for m in measurements]

    fig, ax = plt.subplots(figsize=(width_cm / 2.54, height_cm / 2.54), dpi=150)
    fig.patch.set_facecolor("#FAFAFA")
    ax.set_facecolor("#F5F5F5")

    # Линия данных
    ax.plot(timestamps, temps, color="#1565C0", linewidth=1.6,
            label="Температура (°C)", zorder=3)
    ax.fill_between(timestamps, temps,
                    min(temps) - 1, alpha=0.12, color="#1565C0")

    # Опорные линии
    avg_t = sum(temps) / len(temps)
    ax.axhline(avg_t, color="#43A047", linewidth=1, linestyle="--",
               label=f"Среднее: {avg_t:.1f}°C", zorder=2)

    # Оформление
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%d/%m %H:%M"))
    plt.xticks(rotation=30, ha="right", fontsize=7)
    ax.yaxis.set_tick_params(labelsize=7)
    ax.set_ylabel("°C", fontsize=8)
    ax.set_title("Температура", fontsize=10, fontweight="bold", pad=8)
    ax.legend(fontsize=7, loc="upper right")
    ax.grid(axis="y", linestyle=":", alpha=0.6, color="#BDBDBD")
    ax.spines[["top", "right"]].set_visible(False)

    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf


def _chart_humidity(measurements: list, width_cm: float = 16, height_cm: float = 7) -> io.BytesIO:
    """График влажности во времени."""
    timestamps = [m.timestamp for m in measurements]
    hums = [m.humidity for m in measurements]

    fig, ax = plt.subplots(figsize=(width_cm / 2.54, height_cm / 2.54), dpi=150)
    fig.patch.set_facecolor("#FAFAFA")
    ax.set_facecolor("#F5F5F5")

    ax.plot(timestamps, hums, color="#00838F", linewidth=1.6,
            label="Влажность (%RH)", zorder=3)
    ax.fill_between(timestamps, hums, min(hums) - 1, alpha=0.12, color="#00838F")

    avg_h = sum(hums) / len(hums)
    ax.axhline(avg_h, color="#E65100", linewidth=1, linestyle="--",
               label=f"Среднее: {avg_h:.1f}%", zorder=2)

    ax.xaxis.set_major_formatter(mdates.DateFormatter("%d/%m %H:%M"))
    plt.xticks(rotation=30, ha="right", fontsize=7)
    ax.yaxis.set_tick_params(labelsize=7)
    ax.set_ylabel("%RH", fontsize=8)
    ax.set_title("Влажность", fontsize=10, fontweight="bold", pad=8)
    ax.legend(fontsize=7, loc="upper right")
    ax.grid(axis="y", linestyle=":", alpha=0.6, color="#BDBDBD")
    ax.spines[["top", "right"]].set_visible(False)

    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf


def _chart_combined(measurements: list, width_cm: float = 16, height_cm: float = 9) -> io.BytesIO:
    """Совмещённый график: температура (ось Y1) + влажность (ось Y2)."""
    timestamps = [m.timestamp for m in measurements]
    temps = [m.temperature for m in measurements]
    hums  = [m.humidity    for m in measurements]

    fig, ax1 = plt.subplots(figsize=(width_cm / 2.54, height_cm / 2.54), dpi=150)
    fig.patch.set_facecolor("#FAFAFA")
    ax1.set_facecolor("#F5F5F5")

    color_t = "#1565C0"
    color_h = "#00838F"

    l1, = ax1.plot(timestamps, temps, color=color_t, linewidth=1.8, label="Темп. °C")
    ax1.set_ylabel("Температура (°C)", color=color_t, fontsize=8)
    ax1.tick_params(axis="y", labelcolor=color_t, labelsize=7)
    ax1.fill_between(timestamps, temps, min(temps) - 1, alpha=0.08, color=color_t)

    ax2 = ax1.twinx()
    l2, = ax2.plot(timestamps, hums, color=color_h, linewidth=1.8,
                   linestyle="--", label="Влаж. %RH")
    ax2.set_ylabel("Влажность (%RH)", color=color_h, fontsize=8)
    ax2.tick_params(axis="y", labelcolor=color_h, labelsize=7)

    ax1.xaxis.set_major_formatter(mdates.DateFormatter("%d/%m %H:%M"))
    plt.xticks(rotation=30, ha="right", fontsize=7)
    ax1.set_title("Температура и влажность", fontsize=10, fontweight="bold", pad=8)
    ax1.legend(handles=[l1, l2], fontsize=7, loc="upper left")
    ax1.grid(axis="y", linestyle=":", alpha=0.5, color="#BDBDBD")
    ax1.spines[["top"]].set_visible(False)
    ax2.spines[["top"]].set_visible(False)

    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf


def _chart_alarms_bar(incidents: list, width_cm: float = 10, height_cm: float = 6) -> io.BytesIO | None:
    """Столбчатая диаграмма: количество тревог по типу."""
    if not incidents:
        return None

    from collections import Counter
    counts = Counter(inc.get("title", "Тревога").split("]")[-1].strip()[:20]
                     for inc in incidents)
    labels = list(counts.keys())
    values = list(counts.values())

    palette = ["#EF5350", "#FF7043", "#FFA726", "#FFEE58", "#66BB6A"]
    bar_colors = [palette[i % len(palette)] for i in range(len(labels))]

    fig, ax = plt.subplots(figsize=(width_cm / 2.54, height_cm / 2.54), dpi=150)
    fig.patch.set_facecolor("#FAFAFA")
    ax.set_facecolor("#F5F5F5")

    bars = ax.barh(labels, values, color=bar_colors, edgecolor="white",
                   linewidth=0.8, height=0.55)
    for bar, val in zip(bars, values):
        ax.text(bar.get_width() + 0.05, bar.get_y() + bar.get_height() / 2,
                str(val), va="center", ha="left", fontsize=8)

    ax.set_xlabel("Кол-во событий", fontsize=8)
    ax.set_title("Тревоги по типу", fontsize=10, fontweight="bold", pad=8)
    ax.tick_params(axis="y", labelsize=7)
    ax.tick_params(axis="x", labelsize=7)
    ax.spines[["top", "right"]].set_visible(False)
    ax.set_xlim(0, max(values) * 1.2)
    ax.grid(axis="x", linestyle=":", alpha=0.5, color="#BDBDBD")

    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf


def _chart_stats_mini(temps: list, hums: list,
                       width_cm: float = 8, height_cm: float = 5) -> io.BytesIO:
    """Боксплот температуры и влажности для статистической сводки."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(width_cm / 2.54, height_cm / 2.54), dpi=150)
    fig.patch.set_facecolor("#FAFAFA")

    bp1 = ax1.boxplot(temps, patch_artist=True,
                      boxprops=dict(facecolor="#BBDEFB", color="#1565C0"),
                      medianprops=dict(color="#D32F2F", linewidth=2),
                      whiskerprops=dict(color="#1565C0"),
                      capprops=dict(color="#1565C0"),
                      flierprops=dict(marker="o", color="#EF5350", markersize=4))
    ax1.set_title("Темп. °C", fontsize=8, fontweight="bold")
    ax1.set_facecolor("#F5F5F5")
    ax1.tick_params(labelsize=7)
    ax1.spines[["top", "right"]].set_visible(False)

    bp2 = ax2.boxplot(hums, patch_artist=True,
                      boxprops=dict(facecolor="#B2EBF2", color="#00838F"),
                      medianprops=dict(color="#D32F2F", linewidth=2),
                      whiskerprops=dict(color="#00838F"),
                      capprops=dict(color="#00838F"),
                      flierprops=dict(marker="o", color="#EF5350", markersize=4))
    ax2.set_title("Влажн. %RH", fontsize=8, fontweight="bold")
    ax2.set_facecolor("#F5F5F5")
    ax2.tick_params(labelsize=7)
    ax2.spines[["top", "right"]].set_visible(False)

    plt.tight_layout(pad=1.2)
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf


# ──────────────────────────────────────────────────────────────────────────────
# СТИЛИ ReportLab
# ──────────────────────────────────────────────────────────────────────────────

def _build_styles(font_name: str) -> dict:
    base = getSampleStyleSheet()

    def ps(name, **kw) -> ParagraphStyle:
        return ParagraphStyle(name, fontName=font_name, **kw)

    return {
        "title": ps("ReportTitle", fontSize=18, textColor=colors.HexColor("#0D47A1"),
                    spaceAfter=4, alignment=TA_CENTER, leading=22),
        "subtitle": ps("Subtitle", fontSize=10, textColor=colors.HexColor("#546E7A"),
                       spaceAfter=2, alignment=TA_CENTER),
        "section": ps("Section", fontSize=12, textColor=colors.HexColor("#0D47A1"),
                      spaceBefore=12, spaceAfter=6, leading=16),
        "body": ps("Body", fontSize=9, textColor=colors.HexColor("#212121"),
                   spaceAfter=4, leading=13),
        "small": ps("Small", fontSize=8, textColor=colors.HexColor("#616161"),
                    spaceAfter=2, leading=11),
        "caption": ps("Caption", fontSize=8, textColor=colors.HexColor("#757575"),
                      alignment=TA_CENTER, spaceAfter=8, leading=10),
        "stat_val": ps("StatVal", fontSize=14, textColor=colors.HexColor("#1565C0"),
                       alignment=TA_CENTER, leading=18),
        "stat_lbl": ps("StatLbl", fontSize=7, textColor=colors.HexColor("#757575"),
                       alignment=TA_CENTER, leading=10),
    }


# ──────────────────────────────────────────────────────────────────────────────
# СТРОИТЕЛИ ЭЛЕМЕНТОВ
# ──────────────────────────────────────────────────────────────────────────────

ACCENT   = colors.HexColor("#1565C0")
LIGHT_BG = colors.HexColor("#E3F2FD")
WARN_COL = colors.HexColor("#FF6F00")
OK_COL   = colors.HexColor("#2E7D32")
ERR_COL  = colors.HexColor("#C62828")


def _section_header(text: str, styles: dict):
    return [
        Paragraph(text, styles["section"]),
        HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=4),
    ]


def _kpi_table(items: list[tuple], styles: dict):
    """
    Горизонтальная таблица KPI-карточек.
    items = [(label, value), ...]
    """
    labels = [Paragraph(lbl, styles["stat_lbl"]) for lbl, _ in items]
    values = [Paragraph(val, styles["stat_val"]) for _, val in items]

    col_w = 14.5 * cm / max(len(items), 1)
    t = Table(
        [values, labels],
        colWidths=[col_w] * len(items),
        rowHeights=[22, 14],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [4]),
        ("BOX",        (0, 0), (-1, -1), 0.5, colors.HexColor("#90CAF9")),
        ("INNERGRID",  (0, 0), (-1, -1), 0.3, colors.HexColor("#BBDEFB")),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def _alarm_table(incidents: list, styles: dict):
    """Таблица журнала тревог."""
    header = ["№", "Событие", "Время", "Статус", "Комментарий"]
    rows = [header]
    for i, inc in enumerate(incidents, 1):
        ts = inc.get("timestamp")
        ts_str = ts.strftime("%d.%m %H:%M") if isinstance(ts, datetime) else str(ts)
        status = "✓ Закрыто" if inc.get("is_completed") else "⚠ Активно"
        rows.append([
            str(i),
            str(inc.get("title", "Тревога"))[:35],
            ts_str,
            status,
            str(inc.get("comment", "-"))[:40],
        ])

    col_widths = [1*cm, 5*cm, 2.8*cm, 2.5*cm, 4.5*cm]
    t = Table(rows, colWidths=col_widths, repeatRows=1)

    style = [
        # Заголовок
        ("BACKGROUND",    (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
        ("FONTNAME",      (0, 0), (-1, 0), styles["body"].fontName),
        ("FONTSIZE",      (0, 0), (-1, 0), 8),
        ("ALIGN",         (0, 0), (-1, 0), "CENTER"),
        # Тело
        ("FONTNAME",      (0, 1), (-1, -1), styles["body"].fontName),
        ("FONTSIZE",      (0, 1), (-1, -1), 8),
        ("ALIGN",         (0, 1), (0,  -1), "CENTER"),
        ("ALIGN",         (2, 1), (3,  -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F5F5")]),
        ("GRID",          (0, 0), (-1, -1), 0.4, colors.HexColor("#CFD8DC")),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]

    # Подсветка статуса
    for i, inc in enumerate(incidents, 1):
        col_status = 3
        if inc.get("is_completed"):
            style.append(("TEXTCOLOR", (col_status, i), (col_status, i), OK_COL))
        else:
            style.append(("TEXTCOLOR", (col_status, i), (col_status, i), WARN_COL))

    t.setStyle(TableStyle(style))
    return t


def _measurements_table(measurements: list, styles: dict, max_rows: int = 30):
    """Таблица с сырыми данными измерений (первые max_rows строк)."""
    header = ["№", "Дата и время", "Температура (°C)", "Влажность (%RH)"]
    rows = [header]
    for i, m in enumerate(measurements[:max_rows], 1):
        rows.append([
            str(i),
            m.timestamp.strftime("%d.%m.%Y %H:%M:%S"),
            f"{m.temperature:.2f}",
            f"{m.humidity:.2f}",
        ])
    if len(measurements) > max_rows:
        rows.append(["...", f"Показаны первые {max_rows} из {len(measurements)}", "", ""])

    col_widths = [1*cm, 5*cm, 4.5*cm, 4*cm]
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#37474F")),
        ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
        ("FONTNAME",      (0, 0), (-1, -1), styles["body"].fontName),
        ("FONTSIZE",      (0, 0), (-1, -1), 8),
        ("ALIGN",         (0, 0), (-1, 0),  "CENTER"),
        ("ALIGN",         (0, 1), (0, -1),  "CENTER"),
        ("ALIGN",         (2, 1), (3, -1),  "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, colors.HexColor("#ECEFF1")]),
        ("GRID",          (0, 0), (-1, -1), 0.4, colors.HexColor("#CFD8DC")),
        ("TOPPADDING",    (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


# ──────────────────────────────────────────────────────────────────────────────
# ГЕНЕРАЦИЯ PDF
# ──────────────────────────────────────────────────────────────────────────────

def generate_pdf_report(sensor_data: dict, measurements: list, incidents: list = None) -> bytes:
    """
    Генерирует профессиональный PDF-отчёт с графиками.

    Страница 1: Обложка + KPI-сводка
    Страница 2: Графики температуры, влажности, боксплот
    Страница 3: Совмещённый график + диаграмма тревог
    Страница 4: Журнал тревог (Audit Trail)
    Страница 5: Таблица измерений
    """
    font_name = _register_font()
    styles = _build_styles(font_name)
    incidents = incidents or []

    output = io.BytesIO()
    doc = SimpleDocTemplate(
        output,
        pagesize=A4,
        leftMargin=1.8*cm,
        rightMargin=1.8*cm,
        topMargin=1.8*cm,
        bottomMargin=1.8*cm,
        title=f"Отчет: {sensor_data.get('name', 'N/A')}",
    )

    story = []
    W = A4[0] - 3.6*cm  # рабочая ширина

    sensor_name = sensor_data.get("name", "Неизвестно")
    now_str     = datetime.utcnow().strftime("%d.%m.%Y %H:%M UTC")

    # ── СТРАНИЦА 1: ОБЛОЖКА ─────────────────────────────────────────────────

    story.append(Spacer(1, 1.5*cm))
    story.append(Paragraph("ОТЧЁТ МОНИТОРИНГА", styles["title"]))
    story.append(Paragraph(f"Оборудование: {sensor_name}", styles["subtitle"]))
    story.append(Paragraph(f"Сформирован: {now_str}", styles["small"]))
    story.append(Spacer(1, 0.6*cm))
    story.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=12))

    if measurements:
        temps = [m.temperature for m in measurements]
        hums  = [m.humidity    for m in measurements]
        first_ts = measurements[0].timestamp.strftime("%d.%m.%Y %H:%M")
        last_ts  = measurements[-1].timestamp.strftime("%d.%m.%Y %H:%M")
        avg_t    = round(sum(temps) / len(temps), 1)
        avg_h    = round(sum(hums)  / len(hums),  1)
        mkt      = calculate_mkt(temps)

        kpi_items = [
            ("Всего точек",    str(len(measurements))),
            ("Мин. темп.",     f"{min(temps):.1f}°C"),
            ("Макс. темп.",    f"{max(temps):.1f}°C"),
            ("Среднее темп.",  f"{avg_t}°C"),
            ("MKT",            f"{mkt}°C"),
            ("Среднее влаж.",  f"{avg_h}%"),
        ]
        story.append(Paragraph("Ключевые показатели", styles["section"]))
        story.append(_kpi_table(kpi_items, styles))
        story.append(Spacer(1, 0.4*cm))

        # Период
        period_data = [
            [Paragraph("Период наблюдения", styles["small"]),
             Paragraph(f"{first_ts}  →  {last_ts}", styles["body"])],
            [Paragraph("Тревог зафиксировано", styles["small"]),
             Paragraph(str(len(incidents)), styles["body"])],
        ]
        pt = Table(period_data, colWidths=[5*cm, W-5*cm])
        pt.setStyle(TableStyle([
            ("FONTNAME",  (0, 0), (-1, -1), font_name),
            ("FONTSIZE",  (0, 0), (-1, -1), 9),
            ("VALIGN",    (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",    (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(pt)
    else:
        story.append(Paragraph("Данные за указанный период отсутствуют.", styles["body"]))

    story.append(PageBreak())

    # ── СТРАНИЦА 2: ГРАФИКИ T° и %RH + БОКСПЛОТ ────────────────────────────

    if measurements and len(measurements) >= 2:
        temps = [m.temperature for m in measurements]
        hums  = [m.humidity    for m in measurements]

        story += _section_header("Графики температуры и влажности", styles)

        # График температуры
        buf_t = _chart_temperature(measurements, width_cm=W/cm, height_cm=7)
        story.append(Image(buf_t, width=W, height=7*cm))
        story.append(Paragraph("Рис. 1 — Динамика температуры за период", styles["caption"]))
        story.append(Spacer(1, 0.3*cm))

        # График влажности
        buf_h = _chart_humidity(measurements, width_cm=W/cm, height_cm=7)
        story.append(Image(buf_h, width=W, height=7*cm))
        story.append(Paragraph("Рис. 2 — Динамика влажности за период", styles["caption"]))
        story.append(Spacer(1, 0.3*cm))

        # Боксплот статистики (рядом по 50%)
        buf_box = _chart_stats_mini(temps, hums, width_cm=9, height_cm=5.5)
        story.append(Image(buf_box, width=9*cm, height=5.5*cm))
        story.append(Paragraph("Рис. 3 — Статистическое распределение показателей",
                                styles["caption"]))

        story.append(PageBreak())

    # ── СТРАНИЦА 3: СОВМЕЩЁННЫЙ ГРАФИК + ДИАГРАММА ТРЕВОГ ──────────────────

    if measurements and len(measurements) >= 2:
        story += _section_header("Совмещённый анализ", styles)

        buf_combined = _chart_combined(measurements, width_cm=W/cm, height_cm=9)
        story.append(Image(buf_combined, width=W, height=9*cm))
        story.append(Paragraph("Рис. 4 — Температура и влажность на одной оси",
                                styles["caption"]))
        story.append(Spacer(1, 0.5*cm))

        if incidents:
            buf_bar = _chart_alarms_bar(incidents, width_cm=12, height_cm=6)
            if buf_bar:
                story.append(Image(buf_bar, width=12*cm, height=6*cm))
                story.append(Paragraph("Рис. 5 — Распределение тревог по типу",
                                        styles["caption"]))

        story.append(PageBreak())

    # ── СТРАНИЦА 4: ЖУРНАЛ ТРЕВОГ (AUDIT TRAIL) ────────────────────────────

    story += _section_header("Журнал тревог и инцидентов (Audit Trail)", styles)

    if incidents:
        story.append(_alarm_table(incidents, styles))
    else:
        story.append(Paragraph("За указанный период тревог не зафиксировано.", styles["body"]))

    story.append(Spacer(1, 0.5*cm))

    # Итоговая статистика по тревогам
    if incidents:
        total     = len(incidents)
        resolved  = sum(1 for i in incidents if i.get("is_completed"))
        active    = total - resolved
        alarm_kpi = [
            ("Всего событий", str(total)),
            ("Закрыто",       str(resolved)),
            ("Активных",      str(active)),
        ]
        story.append(Spacer(1, 0.4*cm))
        story.append(_kpi_table(alarm_kpi, styles))

    story.append(PageBreak())

    # ── СТРАНИЦА 5: ТАБЛИЦА ИЗМЕРЕНИЙ ───────────────────────────────────────

    story += _section_header("Данные мониторинга (измерения)", styles)

    if measurements:
        story.append(_measurements_table(measurements, styles, max_rows=40))
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph(
            f"Всего записей: {len(measurements)}. "
            "В таблице отображены первые 40 строк.",
            styles["small"]
        ))
    else:
        story.append(Paragraph("Данные отсутствуют.", styles["body"]))

    # ── FOOTER: ПОДПИСЬ ─────────────────────────────────────────────────────

    story.append(Spacer(1, 0.8*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#B0BEC5")))
    story.append(Paragraph(
        f"Документ сформирован автоматически системой мониторинга  •  {now_str}",
        ParagraphStyle("footer", fontName=font_name, fontSize=7,
                       textColor=colors.HexColor("#9E9E9E"), alignment=TA_CENTER)
    ))

    doc.build(story)
    output.seek(0)
    return output.getvalue()


# ──────────────────────────────────────────────────────────────────────────────
# ГЕНЕРАЦИЯ EXCEL (без изменений логики, небольшое улучшение форматирования)
# ──────────────────────────────────────────────────────────────────────────────

def generate_excel_report(sensor_data: dict, measurements: list, incidents: list = None) -> bytes:
    output = io.BytesIO()
    incidents = incidents or []

    wb = Workbook()
    ws = wb.active
    ws.title = "Report"

    if measurements:
        temps   = [m.temperature for m in measurements]
        first_p = measurements[0].timestamp.strftime("%d/%m/%Y %H:%M:%S")
        stop_p  = measurements[-1].timestamp.strftime("%d/%m/%Y %H:%M:%S")
        max_t   = f"{max(temps):.2f}°C"
        min_t   = f"{min(temps):.2f}°C"
        avg_t   = f"{round(sum(temps) / len(temps), 2)}°C"
        mkt_t   = f"{calculate_mkt(temps)}°C"
    else:
        first_p = stop_p = max_t = min_t = avg_t = mkt_t = "Нет данных"

    # Записываем Device Info
    ws.append(["Device info", ""])
    ws.append(["ID:", sensor_data.get("id", "N/A")])
    ws.append(["Description:", sensor_data.get("name", "N/A")])
    ws.append(["Logging Summary", ""])
    ws.append(["First Point:", first_p])
    ws.append(["Stop time:", stop_p])
    ws.append(["Max:", max_t])
    ws.append(["Min:", min_t])
    ws.append(["MKT:", mkt_t])
    ws.append([])

    ws.append(["ЖУРНАЛ СОБЫТИЙ И КОММЕНТАРИЕВ (Audit Trail)"])
    ws.append(["№", "Событие", "Время", "Статус", "Комментарий"])
    if incidents:
        for i, inc in enumerate(incidents, 1):
            ts = inc.get("timestamp", datetime.now())
            status = "Завершено" if inc.get("is_completed") else "Активно"
            ws.append([i, inc.get("title", "Тревога"), ts.strftime("%d/%m/%Y %H:%M"), status, inc.get("comment", "-")])
    ws.append([])

    ws.append(["ДАННЫЕ МОНИТОРИНГА"])
    ws.append(["No.", "Time", "Temp(°C)", "Hum(%RH)"])
    for i, m in enumerate(measurements, 1):
        ws.append([i, m.timestamp.strftime("%d/%m/%Y %H:%M:%S"), m.temperature, m.humidity])

    wb.save(output)
    output.seek(0)
    return output.getvalue()


# ──────────────────────────────────────────────────────────────────────────────
# CSV ЭКСПОРТ
# ──────────────────────────────────────────────────────────────────────────────

def generate_csv_report(sensor_info: dict, measurements: list, incidents: list = None) -> bytes:
    """
    Генерирует CSV-отчёт с данными датчика и тревогами.
    
    Args:
        sensor_info: {"id": int, "name": str, ...}
        measurements: Список объектов Measurement или словарей
        incidents: Список инцидентов (тревог)
    
    Returns:
        bytes: CSV данные
    """
    import csv
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Заголовок отчёта
    writer.writerow([f"ОТЧЁТ ПО ДАТЧИКУ: {sensor_info.get('name', 'Unknown')}"])
    writer.writerow([f"Идентификатор датчика: {sensor_info.get('id', 'N/A')}"])
    writer.writerow([f"Дата отчёта: {datetime.utcnow().strftime('%d.%m.%Y %H:%M:%S')}"])
    writer.writerow([])
    
    # Статистика
    if measurements:
        temps = [m.get("temperature") or m.temperature if hasattr(m, "temperature") else m.get("temperature") 
                 for m in measurements if hasattr(m, "temperature") or "temperature" in m]
        hums = [m.get("humidity") or m.humidity if hasattr(m, "humidity") else m.get("humidity") 
                for m in measurements if hasattr(m, "humidity") or "humidity" in m]
        
        if temps:
            writer.writerow(["СТАТИСТИКА", ""])
            writer.writerow(["Средняя температура (°C):", f"{sum(temps) / len(temps):.2f}"])
            writer.writerow(["Минимальная температура (°C):", f"{min(temps):.2f}"])
            writer.writerow(["Максимальная температура (°C):", f"{max(temps):.2f}"])
        
        if hums:
            writer.writerow(["Средняя влажность (%RH):", f"{sum(hums) / len(hums):.2f}"])
            writer.writerow(["Минимальная влажность (%RH):", f"{min(hums):.2f}"])
            writer.writerow(["Максимальная влажность (%RH):", f"{max(hums):.2f}"])
    
    writer.writerow([])
    
    # Тревоги/Инциденты
    if incidents and len(incidents) > 0:
        writer.writerow(["ТРЕВОГИ И ИНЦИДЕНТЫ"])
        writer.writerow(["№", "Название", "Время", "Статус", "Комментарий"])
        for i, inc in enumerate(incidents, 1):
            ts = inc.get("timestamp", datetime.now())
            if hasattr(ts, "strftime"):
                ts_str = ts.strftime("%d/%m/%Y %H:%M:%S")
            else:
                ts_str = str(ts)
            status = "Завершено" if inc.get("is_completed") else "Активно"
            writer.writerow([i, inc.get("title", "Тревога"), ts_str, status, inc.get("comment", "-")])
        writer.writerow([])
    
    # Основные данные мониторинга
    writer.writerow(["ДАННЫЕ МОНИТОРИНГА"])
    writer.writerow(["№", "Время", "Температура (°C)", "Влажность (%RH)"])
    
    for i, m in enumerate(measurements, 1):
        if hasattr(m, "timestamp"):
            # Это объект SQLAlchemy
            ts_str = m.timestamp.strftime("%d/%m/%Y %H:%M:%S")
            temp = m.temperature
            hum = m.humidity
        else:
            # Это словарь
            ts = m.get("timestamp", datetime.now())
            ts_str = ts.strftime("%d/%m/%Y %H:%M:%S") if hasattr(ts, "strftime") else str(ts)
            temp = m.get("temperature", "N/A")
            hum = m.get("humidity", "N/A")
        
        writer.writerow([i, ts_str, temp, hum])
    
    # Получаем строковое значение и конвертируем в байты
    csv_string = output.getvalue()
    return csv_string.encode("utf-8-sig")  # utf-8-sig для корректного отображения кириллицы в Excel
    return output.getvalue()