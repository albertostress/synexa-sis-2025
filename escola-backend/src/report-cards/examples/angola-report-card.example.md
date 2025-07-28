# Boletim Escolar Angola - Exemplos de Uso

## Endpoint Principal
```http
GET /report-cards/:studentId?year=2024&term=1
Authorization: Bearer {jwt_token}
```

## Exemplos de Chamadas

### 1. Boletim do 1º Trimestre
```bash
curl -X GET "http://localhost:3000/report-cards/EST20250715?year=2024&term=1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Boletim Anual Completo
```bash
curl -X GET "http://localhost:3000/report-cards/EST20250715?year=2024" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Exemplo de Resposta JSON

```json
{
  "student": {
    "name": "João Silva Santos",
    "fatherName": "António Silva",
    "className": "12ª Classe - Turma A",
    "shift": "Manhã",
    "birthDate": "15/03/2006",
    "academicYear": 2024
  },
  "subjects": [
    {
      "subjectName": "Matemática",
      "teacherName": "Prof. Maria Santos",
      "mac": 14.0,
      "npp": 16.0,
      "npt": 15.0,
      "mt": 15.0,
      "fal": 2,
      "classification": "Muito Bom"
    },
    {
      "subjectName": "Português",
      "teacherName": "Prof. Carlos Costa",
      "mac": 13.0,
      "npp": 14.0,
      "npt": 12.0,
      "mt": 13.0,
      "fal": 1,
      "classification": "Bom"
    },
    {
      "subjectName": "História de Angola",
      "teacherName": "Prof. Ana Luísa",
      "mac": 18.0,
      "npp": 17.0,
      "npt": 19.0,
      "mt": 18.0,
      "fal": 0,
      "classification": "Excelente"
    },
    {
      "subjectName": "Física",
      "teacherName": "Prof. Pedro Mendes",
      "mac": 11.0,
      "npp": 10.0,
      "npt": 12.0,
      "mt": 11.0,
      "fal": 3,
      "classification": "Satisfatório"
    },
    {
      "subjectName": "Química",
      "teacherName": "Prof. Marta Teixeira",
      "mac": 8.0,
      "npp": 9.0,
      "npt": 8.5,
      "mt": 8.5,
      "fal": 5,
      "classification": "Não Satisfatório"
    }
  ],
  "averageGrade": 13.1,
  "finalStatus": "Reprovado",
  "attendancePercentage": 92.3,
  "term": 1,
  "year": 2024,
  "generatedAt": "2024-07-22T14:30:00.000Z"
}
```

## Sistema de Classificação Angola (MINED)

| Intervalo | Classificação    |
|-----------|------------------|
| 17-20     | Excelente        |
| 14-16     | Muito Bom        |
| 12-13     | Bom              |
| 10-11     | Satisfatório     |
| 0-9       | Não Satisfatório |

## Cálculo da Média Trimestral (MT)
```
MT = (MAC + NPP + NPT) / 3
```

## Situação Final
- **Aprovado**: MT ≥ 10 em todas as disciplinas
- **Reprovado**: MT < 10 em qualquer disciplina

## Roles com Acesso
- ADMIN
- DIRETOR  
- SECRETARIA

## Codes de Resposta
- `200`: Boletim gerado com sucesso
- `400`: Aluno sem matrícula ativa ou sem notas no período
- `404`: Aluno não encontrado
- `401`: Token inválido ou expirado
- `403`: Usuário sem permissão