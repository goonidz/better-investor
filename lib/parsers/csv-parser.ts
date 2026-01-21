import Papa from 'papaparse'

export interface ParsedCSV {
  data: any[]
  meta: {
    fields?: string[]
    delimiter: string
    linebreak: string
    aborted: boolean
    truncated: boolean
    cursor: number
  }
}

export async function parseCSV(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results as ParsedCSV)
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}
