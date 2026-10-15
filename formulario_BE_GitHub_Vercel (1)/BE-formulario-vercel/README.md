# Formulário BE

Site estático para publicação no Vercel conectado ao Google Apps Script.

## Publicar
1. Crie um repositório no GitHub e envie `index.html` para a raiz do repositório.
2. No Vercel, escolha **Add New → Project** e importe esse repositório.
3. Para um site HTML simples, não precisa configurar Framework Preset nem Build Command. Deixe o Output Directory vazio ou como `.` se solicitado.
4. Clique em **Deploy**.
5. Abra o domínio `.vercel.app` gerado e envie uma resposta de teste.
6. Confirme que a resposta entrou na planilha Google Sheets.

O formulário usa a URL pública do Web App do Google Apps Script configurada em `index.html`.
