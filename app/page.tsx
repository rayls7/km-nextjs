"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Save, Trash2, Download, Upload, FileText, FileSpreadsheet } from "lucide-react"
import { KMEntryCard } from "@/components/km-entry-card"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

interface KMEntry {
  id: string
  imageData: string
  date: string
  type: "Entrada" | "Saída"
}

interface FormData {
  cycle: string
  employeeName: string
  sector: string
  branch: string
  entries: KMEntry[]
}

const parseDateLocal = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

const formatDateBR = (dateString: string): string => {
  const date = parseDateLocal(dateString)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const formatFullDateBR = (dateString: string): string => {
  const date = parseDateLocal(dateString)
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const formatCycleBR = (cycleString: string): string => {
  if (!cycleString) return ""

  const [year, month] = cycleString.split("-")
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const monthIndex = Number.parseInt(month) - 1
  return `${monthNames[monthIndex]} de ${year}`
}

export default function KMRegistrationPage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState<FormData>({
    cycle: "",
    employeeName: "",
    sector: "CPD",
    branch: "IMP",
    entries: [],
  })
  const [isEntrada, setIsEntrada] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  const addEntry = () => {
    const newEntry: KMEntry = {
      id: Date.now().toString(),
      imageData: "",
      date: new Date().toISOString().split("T")[0],
      type: isEntrada ? "Entrada" : "Saída",
    }
    setFormData((prev) => ({
      ...prev,
      entries: [...prev.entries, newEntry],
    }))
    setIsEntrada(!isEntrada)
  }

  const removeEntry = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      entries: prev.entries.filter((entry) => entry.id !== id),
    }))
  }

  const updateEntry = (id: string, updates: Partial<KMEntry>) => {
    setFormData((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)),
    }))
  }

  const saveData = () => {
    localStorage.setItem("kmData", JSON.stringify(formData))
    toast({
      title: "Beleza, salvei seus dados.",
      description: "Seus dados foram salvos com sucesso!",
    })
  }

  const loadData = () => {
    const savedData = localStorage.getItem("kmData")
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setFormData(parsed)
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }
  }

  const clearData = () => {
    if (confirm("Tem certeza que deseja limpar todos os dados?")) {
      localStorage.removeItem("kmData")
      setFormData({
        cycle: "",
        employeeName: "",
        sector: "CPD",
        branch: "IMP",
        entries: [],
      })
      toast({
        title: "Dados limpos",
        description: "Todos os dados foram removidos.",
      })
    }
  }

  const exportData = () => {
    const dataStr = JSON.stringify(formData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `km-data-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Beleza, baixei teu backup",
      description: "Backup baixado com sucesso!",
    })
  }

  const exportToExcel = () => {
    const worksheetData = [
      ["FORMULÁRIO DE REGISTRO DE QUILOMETRAGEM"],
      [],
      ["INFORMAÇÕES DO COLABORADOR"],
      ["Ciclo", formData.cycle],
      ["Colaborador", formData.employeeName],
      ["Setor", formData.sector],
      ["Filial", formData.branch],
      [],
      ["REGISTROS DE ENTRADA E SAÍDA"],
      ["#", "Tipo", "Data", "Status da Imagem", "Observações"],
    ]

    formData.entries.forEach((entry, index) => {
      worksheetData.push([
        index + 1,
        entry.type,
        formatDateBR(entry.date),
        entry.imageData ? "✓ Anexada" : "✗ Sem imagem",
        "",
      ])
    })

    worksheetData.push([])
    worksheetData.push(["Total de Registros", formData.entries.length])
    worksheetData.push(["Data de Exportação", formatDateBR(new Date().toISOString())])

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(worksheetData)

    ws["!cols"] = [{ wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 30 }]

    const range = XLSX.utils.decode_range(ws["!ref"] || "A1")

    if (ws["A1"]) {
      ws["A1"].s = {
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1E3A8A" } },
        alignment: { horizontal: "center", vertical: "center" },
      }
    }

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
      { s: { r: 8, c: 0 }, e: { r: 8, c: 4 } },
    ]

    if (ws["A3"]) {
      ws["A3"].s = {
        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "FB923C" } },
        alignment: { horizontal: "center" },
      }
    }

    if (ws["A9"]) {
      ws["A9"].s = {
        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "FB923C" } },
        alignment: { horizontal: "center" },
      }
    }

    for (let col = 0; col <= 4; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 9, c: col })
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1E3A8A" } },
          alignment: { horizontal: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        }
      }
    }

    const dataStartRow = 10
    const dataEndRow = dataStartRow + formData.entries.length - 1
    for (let row = dataStartRow; row <= dataEndRow; row++) {
      const isEven = (row - dataStartRow) % 2 === 0
      for (let col = 0; col <= 4; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            fill: { fgColor: { rgb: isEven ? "F3F4F6" : "FFFFFF" } },
            alignment: { horizontal: col === 0 ? "center" : "left" },
            border: {
              top: { style: "thin", color: { rgb: "E5E7EB" } },
              bottom: { style: "thin", color: { rgb: "E5E7EB" } },
              left: { style: "thin", color: { rgb: "E5E7EB" } },
              right: { style: "thin", color: { rgb: "E5E7EB" } },
            },
          }
        }
      }
    }

    for (let row = 3; row <= 6; row++) {
      if (ws[XLSX.utils.encode_cell({ r: row, c: 0 })]) {
        ws[XLSX.utils.encode_cell({ r: row, c: 0 })].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "E0E7FF" } },
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Registro KM")

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `km-registro-${formData.employeeName || "dados"}-${Date.now()}.xlsx`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Excel exportado",
      description: "Planilha formatada baixada com sucesso!",
    })
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          setFormData(data)
          localStorage.setItem("kmData", JSON.stringify(data))
          toast({
            title: "Backup realizado!",
            description: "Dados carregados com sucesso!",
          })
        } catch (error) {
          toast({
            title: "Erro",
            description: "Arquivo inválido.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    }
  }

  const printPDF = () => {
    window.print()
  }

  const groupEntriesByDate = () => {
    const grouped: { [key: string]: KMEntry[] } = {}

    formData.entries.forEach((entry) => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = []
      }
      grouped[entry.date].push(entry)
    })

    // Sort dates in ascending order
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

    return sortedDates.map((date) => ({
      date,
      entries: grouped[date],
    }))
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2 no-print">
          <h1 className="text-4xl font-bold text-primary tracking-tight">Formulário de KM</h1>
          <p className="text-muted-foreground">Sistema de registro de quilometragem</p>
        </div>

        <Card className="no-print">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cycle" className="text-sm font-medium">
                  Ciclo
                </Label>
                <Input
                  id="cycle"
                  type="month"
                  value={formData.cycle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cycle: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeName" className="text-sm font-medium">
                  Nome do Colaborador
                </Label>
                <Input
                  id="employeeName"
                  type="text"
                  placeholder="Seu nome é?..."
                  value={formData.employeeName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, employeeName: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector" className="text-sm font-medium">
                  Setor
                </Label>
                <Select
                  value={formData.sector}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, sector: value }))}
                >
                  <SelectTrigger id="sector">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADM">ADM</SelectItem>
                    <SelectItem value="COBRANÇA">COBRANÇA</SelectItem>
                    <SelectItem value="CPD">CPD</SelectItem>
                    <SelectItem value="COMERCIAL">COMERCIAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch" className="text-sm font-medium">
                  Filial
                </Label>
                <Select
                  value={formData.branch}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, branch: value }))}
                >
                  <SelectTrigger id="branch">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMP">IMP</SelectItem>
                    <SelectItem value="AÇA">AÇA</SelectItem>
                    <SelectItem value="MAR">MAR</SelectItem>
                    <SelectItem value="SSL">SSL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="hidden print:block print-header">
          <h1 className="text-3xl font-bold text-center mb-4">Formulário de KM</h1>
          <div className="print-header-grid">
            <div>
              <strong>Ciclo:</strong> <span>{formatCycleBR(formData.cycle)}</span>
            </div>
            <div>
              <strong>Colaborador:</strong> <span>{formData.employeeName}</span>
            </div>
            <div>
              <strong>Setor:</strong> <span>{formData.sector}</span>
            </div>
            <div>
              <strong>Filial:</strong> <span>{formData.branch}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
          {formData.entries.map((entry) => (
            <KMEntryCard
              key={entry.id}
              entry={entry}
              onUpdate={(updates) => updateEntry(entry.id, updates)}
              onRemove={() => removeEntry(entry.id)}
            />
          ))}
        </div>

        <div className="hidden print:block">
          {groupEntriesByDate().map((group) => (
            <div key={group.date} className="print-date-group">
              <div className="print-date-header">{formatFullDateBR(group.date)}</div>
              <div className="print-entries-grid">
                {group.entries.map((entry) => (
                  <div key={entry.id} className="print-entry-card">
                    <div className={`print-entry-type ${entry.type.toLowerCase()}`}>{entry.type}</div>
                    {entry.imageData && (
                      <img src={entry.imageData || "/placeholder.svg"} alt={entry.type} className="print-entry-image" />
                    )}
                    <div className="print-entry-date">{formatDateBR(entry.date)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 no-print">
           <Button onClick={addEntry} size="lg" className="w-full max-w-md">
            <Plus className="mr-2 h-5 w-5" />
            Adicionar
          </Button>

          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={saveData} variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
            <Button onClick={clearData} variant="outline">
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar
            </Button>
            <Button onClick={exportData} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Salvar backup
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Carregar backup
            </Button>
            <Button
  onClick={exportToExcel}
  className="bg-[#217346] hover:bg-[#1e633e] text-white border-none"
>
  <FileSpreadsheet className="mr-2 h-4 w-4" />
  Exportar Excel
</Button>

            <Button 
  onClick={printPDF} 
  variant="outline"
  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
>
  <FileText className="mr-2 h-4 w-4" />
  Salvar PDF
</Button>
</div>

          <input ref={fileInputRef} type="file" accept=".json" onChange={importData} className="hidden" />
        </div>
      </div>
    </div>
  )
}
