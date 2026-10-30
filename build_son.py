import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import datetime
import calendar
import os
import copy

wb_tpl = openpyxl.load_workbook('sardunya_copy.xlsx')

mail_folder = 'yemek sayıları exel/yemek sayıları exel'
mail_files = {
    'mart': 'YEMEK SAYILARI-Öğlen-kumanya-sahur sayıları-mart 2026.xlsx',
    'nisan': 'YEMEK SAYILARI-NİSAN 2026-nisan 2026.xlsx',
    'mayis': 'YEMEK SAYILARI-MAYIS 2026.2.xlsx',
    'haziran': 'YEMEK SAYILARI-HAZİRAN 2026.xlsx',
    'temmuz': 'YEMEK SAYILARI-TEMMUZ 2026 -türker topcu.xlsx',
    'agustos': 'YEMEK SAYILARI-AĞUSTOS 2026 -türker topcu.xlsx',
    'eylul': 'YEMEK SAYILARI-EYLÜL 2026 -türker topcu -.1.xlsx',
    'ekim': 'YEMEK SAYILARI-EKİM 2026 -türker topcu -.xlsx'
}

def load_mail_data(fname):
    p = os.path.join(mail_folder, fname)
    wb = openpyxl.load_workbook(p, data_only=True)
    ws = wb['DS SMITH']
    data = {}
    for r in range(1, ws.max_row + 1):
        d = ws.cell(r, 1).value
        if hasattr(d, 'strftime'):
            ds = d.strftime('%Y-%m-%d')
            if 'mart' in fname.lower():
                data[ds] = {
                    'oglen': ws.cell(r, 2).value,
                    'gece': 0,
                    'kumanya': ws.cell(r, 3).value,
                    'sahur': ws.cell(r, 4).value,
                    'yogurt': ws.cell(r, 5).value,
                    'ayran': ws.cell(r, 6).value,
                    'cacik': ws.cell(r, 7).value,
                    'acma': None,
                    'sandvic': None,
                    'aciklama': ws.cell(r, 8).value
                }
            elif 'nisan' in fname.lower():
                data[ds] = {
                    'oglen': ws.cell(r, 2).value,
                    'gece': ws.cell(r, 3).value,
                    'kumanya': ws.cell(r, 4).value,
                    'yogurt': ws.cell(r, 5).value,
                    'ayran': ws.cell(r, 6).value,
                    'cacik': ws.cell(r, 7).value,
                    'acma': None,
                    'sandvic': None,
                    'aciklama': ws.cell(r, 8).value
                }
            else:
                data[ds] = {
                    'oglen': ws.cell(r, 2).value,
                    'gece': ws.cell(r, 3).value,
                    'kumanya': ws.cell(r, 4).value,
                    'yogurt': ws.cell(r, 5).value,
                    'ayran': ws.cell(r, 6).value,
                    'cacik': ws.cell(r, 7).value,
                    'acma': ws.cell(r, 8).value if ws.max_column >= 8 else None,
                    'sandvic': ws.cell(r, 9).value if ws.max_column >= 9 else None,
                    'aciklama': ws.cell(r, 10).value if ws.max_column >= 10 else None
                }
    return data

mail_data = {m: load_mail_data(f) for m, f in mail_files.items()}

# Complete Mart missing days (March 18 to 31)
ws_mart = wb_tpl['mart']
mart_map = {
    22: '2026-03-18', 23: '2026-03-19', 24: '2026-03-20', 25: '2026-03-21',
    27: '2026-03-22', 28: '2026-03-23', 29: '2026-03-24', 30: '2026-03-25',
    31: '2026-03-26', 32: '2026-03-27', 33: '2026-03-28',
    35: '2026-03-29', 36: '2026-03-30', 37: '2026-03-31'
}
mart_days = mail_data['mart']
for r, ds in mart_map.items():
    if ds in mart_days:
        info = mart_days[ds]
        ws_mart.cell(r, 2).value = info['oglen']
        ws_mart.cell(r, 3).value = info['gece']
        ws_mart.cell(r, 4).value = info['kumanya']
        ws_mart.cell(r, 5).value = info['yogurt']
        ws_mart.cell(r, 6).value = info['ayran']
        ws_mart.cell(r, 7).value = info['cacik']
        if info.get('sahur') is not None and ws_mart.cell(r, 13).value is None:
            ws_mart.cell(r, 13).value = info['sahur']

# Styles extracted from template
font_header = Font(name='Cavolini', size=11, bold=True)
font_bold = Font(name='Cavolini', size=11, bold=True)
font_regular = Font(name='Cavolini', size=11, bold=False)

fill_header = PatternFill(start_color='B7DEE8', end_color='B7DEE8', fill_type='solid')
fill_yellow = PatternFill(start_color='FFFF00', end_color='FFFF00', fill_type='solid')

align_center = Alignment(horizontal='center', vertical='center')
align_left = Alignment(horizontal='left', vertical='center')
align_right = Alignment(horizontal='right', vertical='center')

border_thin = Border(
    left=Side(style='thin', color='A6A6A6'),
    right=Side(style='thin', color='A6A6A6'),
    top=Side(style='thin', color='A6A6A6'),
    bottom=Side(style='thin', color='A6A6A6')
)

num_fmt_currency = '#,##0.00'
num_fmt_date = '[$-F800]dddd\\,\\ mmmm\\ dd\\,\\ yyyy'

# Month configurations
months_config = [
    {
        'key': 'nisan', 'name': 'nisan', 'month_num': 4, 'year': 2026, 'days': 30,
        'has_breakfast': False,
        'prices': {'kahvalti': 230, 'yemek': 250, 'yogurt': 18.86, 'ayran': 18.86, 'cacik': 18.86}
    },
    {
        'key': 'mayis', 'name': 'mayıs', 'month_num': 5, 'year': 2026, 'days': 31,
        'has_breakfast': True,
        'prices': {'kahvalti': 230, 'yemek': 250, 'yogurt': 18.86, 'ayran': 18.86, 'cacik': 18.86, 'acma': 47.25, 'sandvic': 47.25}
    },
    {
        'key': 'haziran', 'name': 'haziran', 'month_num': 6, 'year': 2026, 'days': 30,
        'has_breakfast': True,
        'prices': {'kahvalti': 230, 'yemek': 250, 'yogurt': 18.86, 'ayran': 18.86, 'cacik': 18.86, 'acma': 47.25, 'sandvic': 47.25}
    },
    {
        'key': 'temmuz', 'name': 'temmuz', 'month_num': 7, 'year': 2026, 'days': 31,
        'has_breakfast': True,
        'prices': {'kahvalti': 230, 'yemek': 250, 'yogurt': 18.86, 'ayran': 18.86, 'cacik': 18.86, 'acma': 47.25, 'sandvic': 47.25}
    },
    {
        'key': 'agustos', 'name': 'ağustos', 'month_num': 8, 'year': 2026, 'days': 31,
        'has_breakfast': True,
        'prices': {'kahvalti': 230, 'yemek': 275, 'yogurt': 20.75, 'ayran': 20.75, 'cacik': 20.75, 'acma': 51.97, 'sandvic': 51.97}
    },
    {
        'key': 'eylul', 'name': 'eylül', 'month_num': 9, 'year': 2026, 'days': 30,
        'has_breakfast': True,
        'prices': {'kahvalti': 230, 'yemek': 275, 'yogurt': 20.75, 'ayran': 20.75, 'cacik': 20.75, 'acma': 51.97, 'sandvic': 51.97}
    },
    {
        'key': 'ekim', 'name': 'ekim', 'month_num': 10, 'year': 2026, 'days': 31,
        'has_breakfast': True,
        'prices': {'kahvalti': 230, 'yemek': 275, 'yogurt': 20.75, 'ayran': 20.75, 'cacik': 20.75, 'acma': 51.97, 'sandvic': 51.97}
    }
]

def build_month_sheet(cfg):
    ws = wb_tpl.create_sheet(title=cfg['name'])
    m_data = mail_data[cfg['key']]
    has_b = cfg['has_breakfast']
    prices = cfg['prices']
    num_days = cfg['days']
    month_num = cfg['month_num']
    year = cfg['year']

    # Column widths
    col_widths = {
        'A': 32, 'B': 14, 'C': 14, 'D': 12, 'E': 12, 'F': 12, 'G': 12
    }
    if has_b:
        col_widths.update({'H': 18, 'I': 14, 'J': 4, 'K': 18, 'L': 15, 'M': 14, 'N': 16, 'O': 16})
    else:
        col_widths.update({'H': 18, 'I': 15, 'J': 14, 'K': 16, 'L': 16})

    for col_l, w in col_widths.items():
        ws.column_dimensions[col_l].width = w

    # Row 2 Headers
    headers = [
        ('A', 'tarih'), ('B', 'öğlen yemeği'), ('C', 'gece yemeği'),
        ('D', 'kahvaltı'), ('E', 'yoğurt'), ('F', 'ayran'), ('G', 'cacık')
    ]
    if has_b:
        headers.extend([
            ('H', 'açma-poğaça'), ('I', 'sandviç'),
            ('K', 'açıklama'), ('L', 'toplam adet'), ('M', 'birim fiyat'), ('N', 'toplam fiyat')
        ])
    else:
        headers.extend([
            ('I', 'toplam adet'), ('J', 'birim fiyat'), ('K', 'toplam fiyat')
        ])

    for col_l, htext in headers:
        cell = ws[f'{col_l}2']
        cell.value = htext
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = border_thin

    # Define weeks
    # Week 1: 1-7, row 10 is total
    # Week 2: 8-14, row 18 is total
    # Week 3: 15-21, row 26 is total
    # Week 4: 22-28, row 34 is total
    # Week 5: 29-30 (or 31), row 38 (or 39) is total
    weeks = [
        (3, 9, 10, 1, 7),
        (11, 17, 18, 8, 14),
        (19, 25, 26, 15, 21),
        (27, 33, 34, 22, 28)
    ]
    if num_days == 30:
        weeks.append((35, 36, 37, 29, 30))
    else:
        weeks.append((35, 37, 38, 29, 31))

    # Pricing table positions:
    # In each week, pricing block starts at start_row (or row 26 for week 4 in template, row 35 for week 5)
    # Let's map pricing block start rows:
    # W1: start_row=3, total_row=10, sum_cell=K8 (or N8 if has_b)
    # W2: start_row=11, total_row=18, sum_cell=K16 (or N16)
    # W3: start_row=19, total_row=26, sum_cell=K24 (or N24)
    # W4: start_row=26, total_row=34, sum_cell=K31 (or N31)
    # W5: start_row=35, total_row=37/38, sum_cell=K40 (or N40)
    
    # Fill daily rows
    all_data_cols = ['B', 'C', 'D', 'E', 'F', 'G']
    if has_b:
        all_data_cols.extend(['H', 'I'])

    for start_r, end_r, tot_r, start_d, end_d in weeks:
        cur_day = start_d
        for r in range(start_r, end_r + 1):
            dt = datetime.datetime(year, month_num, cur_day, 0, 0)
            ds = dt.strftime('%Y-%m-%d')
            
            # Col A: Date
            cell_a = ws[f'A{r}']
            cell_a.value = dt
            cell_a.font = font_bold
            cell_a.alignment = align_left
            cell_a.border = border_thin
            cell_a.number_format = num_fmt_date

            # Data columns
            info = m_data.get(ds)
            # If date exists in mail data and has non-None values:
            is_valid = info is not None and any(info[k] is not None for k in ['oglen', 'gece', 'kumanya', 'yogurt', 'ayran', 'cacik'])
            
            vals_to_put = {
                'B': info['oglen'] if is_valid else None,
                'C': info['gece'] if is_valid else None,
                'D': info['kumanya'] if is_valid else None,
                'E': info['yogurt'] if is_valid else None,
                'F': info['ayran'] if is_valid else None,
                'G': info['cacik'] if is_valid else None
            }
            if has_b:
                vals_to_put['H'] = info['acma'] if is_valid else None
                vals_to_put['I'] = info['sandvic'] if is_valid else None

            for col_l in all_data_cols:
                c = ws[f'{col_l}{r}']
                c.value = vals_to_put[col_l]
                c.font = font_bold
                c.alignment = align_center
                c.border = border_thin

            cur_day += 1

        # Week Total Row (tot_r)
        cell_tot = ws[f'A{tot_r}']
        cell_tot.value = 'toplam'
        cell_tot.font = font_bold
        cell_tot.alignment = align_left
        cell_tot.border = border_thin

        for col_l in all_data_cols:
            c = ws[f'{col_l}{tot_r}']
            c.value = f'=SUM({col_l}{start_r}:{col_l}{end_r})'
            c.font = font_bold
            c.alignment = align_center
            c.border = border_thin

    # Pricing Blocks
    # For each week, write the pricing block
    pricing_items = [
        ('kahvaltı', 'D', prices['kahvalti']),
        ('yemek ', ('B', 'C'), prices['yemek']),
        ('yoğurt  ', 'E', prices['yogurt']),
        ('ayran', 'F', prices['ayran']),
        ('cacık', 'G', prices['cacik'])
    ]
    if has_b:
        pricing_items.extend([
            ('açma-poğaça', 'H', prices['acma']),
            ('sandviç', 'I', prices['sandvic'])
        ])

    # Pricing week layout definitions:
    # (pricing_start_row, week_tot_row, sum_result_row)
    p_defs = [
        (3, 10, 3 + len(pricing_items)),
        (11, 18, 11 + len(pricing_items)),
        (19, 26, 19 + len(pricing_items)),
        (26 if not has_b else 27, 34, (26 if not has_b else 27) + len(pricing_items)),
        (35, 37 if num_days == 30 else 38, 35 + len(pricing_items))
    ]

    p_col_desc = 'K' if has_b else 'H'
    p_col_qty = 'L' if has_b else 'I'
    p_col_price = 'M' if has_b else 'J'
    p_col_tot = 'N' if has_b else 'K'
    p_col_month_tot = 'O' if has_b else 'L'

    sum_cells = []
    for p_start, w_tot_r, sum_r in p_defs:
        for idx, (item_name, col_ref, u_price) in enumerate(pricing_items):
            cur_r = p_start + idx
            
            # Desc
            c_desc = ws[f'{p_col_desc}{cur_r}']
            c_desc.value = item_name
            c_desc.font = font_bold
            c_desc.alignment = align_center
            c_desc.border = border_thin

            # Qty formula
            c_qty = ws[f'{p_col_qty}{cur_r}']
            if isinstance(col_ref, tuple):
                c_qty.value = f'={col_ref[0]}{w_tot_r}+{col_ref[1]}{w_tot_r}'
            else:
                c_qty.value = f'={col_ref}{w_tot_r}'
            c_qty.font = font_bold
            c_qty.alignment = align_center
            c_qty.border = border_thin

            # Unit price
            c_price = ws[f'{p_col_price}{cur_r}']
            c_price.value = u_price
            c_price.font = font_bold
            c_price.alignment = align_center
            c_price.border = border_thin
            c_price.number_format = num_fmt_currency

            # Total price formula
            c_tot = ws[f'{p_col_tot}{cur_r}']
            c_tot.value = f'={p_col_qty}{cur_r}*{p_col_price}{cur_r}'
            c_tot.font = font_bold
            c_tot.alignment = align_center
            c_tot.border = border_thin
            c_tot.number_format = num_fmt_currency

        # Sum of this week's pricing
        c_wsum = ws[f'{p_col_tot}{sum_r}']
        c_wsum.value = f'=SUM({p_col_tot}{p_start}:{p_col_tot}{p_start + len(pricing_items) - 1})'
        c_wsum.font = font_bold
        c_wsum.alignment = align_center
        c_wsum.border = border_thin
        c_wsum.number_format = num_fmt_currency
        sum_cells.append(f'{p_col_tot}{sum_r}')

    # Grand Total for the month in Row 9
    c_gtot = ws[f'{p_col_month_tot}9']
    c_gtot.value = f'={" + ".join(sum_cells)}'
    c_gtot.font = Font(name='Cavolini', size=12, bold=True, color='0000FF')
    c_gtot.alignment = align_center
    c_gtot.border = border_thin
    c_gtot.number_format = num_fmt_currency

    # Unit price reference table at bottom right (rows 45-50)
    ref_start = 45
    ws[f'{p_col_desc}{ref_start}'].value = 'açıklama'
    ws[f'{p_col_desc}{ref_start}'].font = font_header
    ws[f'{p_col_desc}{ref_start}'].fill = fill_header
    ws[f'{p_col_desc}{ref_start}'].border = border_thin
    ws[f'{p_col_qty}{ref_start}'].value = 'adet fiyatı'
    ws[f'{p_col_qty}{ref_start}'].font = font_header
    ws[f'{p_col_qty}{ref_start}'].fill = fill_header
    ws[f'{p_col_qty}{ref_start}'].border = border_thin

    ref_items = [
        ('yemek (öğlen/gece)', prices['yemek']),
        ('yemek (kahvaltı tabağı)', prices['kahvalti']),
        ('yoğurt-ayran-cacık', prices['yogurt'])
    ]
    if has_b:
        ref_items.extend([
            ('açma-poğaça', prices['acma']),
            ('sandviç', prices['sandvic'])
        ])

    for i, (r_name, r_price) in enumerate(ref_items, start=1):
        r_row = ref_start + i
        ws[f'{p_col_desc}{r_row}'].value = r_name
        ws[f'{p_col_desc}{r_row}'].font = font_bold
        ws[f'{p_col_desc}{r_row}'].border = border_thin
        ws[f'{p_col_qty}{r_row}'].value = r_price
        ws[f'{p_col_qty}{r_row}'].font = font_bold
        ws[f'{p_col_qty}{r_row}'].border = border_thin
        ws[f'{p_col_qty}{r_row}'].number_format = num_fmt_currency

    print(f"Sheet {cfg['name']} created successfully!")

# Build all sheets
for cfg in months_config:
    build_month_sheet(cfg)

# Save workbook as son.xlsx
output_path = 'son.xlsx'
wb_tpl.save(output_path)
print(f"Successfully generated {output_path} with sheets: {wb_tpl.sheetnames}")
