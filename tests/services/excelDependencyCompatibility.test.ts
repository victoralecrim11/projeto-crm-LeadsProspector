import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';

test('ExcelJS atualizado preserva escrita e leitura de XLSX', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Leads');
  sheet.columns = [
    { header: 'Empresa', key: 'name', width: 24 },
    { header: 'Score', key: 'score', width: 12 },
  ];
  sheet.addRow({ name: 'Negócio local', score: 85 });

  const bytes = await workbook.xlsx.writeBuffer();
  assert.ok(bytes.byteLength > 0);

  const restored = new ExcelJS.Workbook();
  await restored.xlsx.load(bytes);
  assert.equal(restored.getWorksheet('Leads')?.getCell('A2').value, 'Negócio local');
  assert.equal(restored.getWorksheet('Leads')?.getCell('B2').value, 85);
});
