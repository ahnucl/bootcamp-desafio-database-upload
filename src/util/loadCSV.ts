import fs from 'fs';
import csvParse from 'csv-parse';

async function loadCSV(filepath: string): Promise<string[][]> {
  const readCSVStream = fs.createReadStream(filepath);

  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });

  const parseCSV = readCSVStream.pipe(parseStream);

  const lines: string[][] = [];

  parseCSV.on('data', line => {
    const [title, type, value] = line;

    if (!title || !type || !value) return;

    lines.push(line);
  });

  await new Promise(resolve => {
    parseCSV.on('end', resolve);
  });

  return lines;
}

export default loadCSV;
