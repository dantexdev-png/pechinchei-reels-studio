# Pechinchei Reels Studio

Editor independente de vídeos curtos para o Pechinchei.

## Publicação
Este projeto é um site estático publicado pelo GitHub Pages. O workflow em `.github/workflows/pages.yml` publica o conteúdo da raiz do repositório.

Depois do primeiro push:
1. Abra **Settings → Pages**.
2. Em **Build and deployment**, selecione **GitHub Actions** se ainda não estiver selecionado.
3. Acompanhe a execução em **Actions**.

Endereço esperado: https://dantexdev-png.github.io/pechinchei-reels-studio/

## Privacidade e IA
A edição e a renderização do vídeo são feitas localmente no navegador. A integração com Gemini está temporariamente aguardando um backend independente e seguro. **Não coloque a chave Gemini neste repositório, no HTML ou em JavaScript público.**

Este projeto é independente do Radar de Ofertas.

## Ativar a análise com Gemini

A chave Gemini fica somente no servidor, nunca no HTML público.

1. Entre no Cloudflare e abra **Workers & Pages**.
2. Crie um Worker novo e substitua o código inicial pelo conteúdo do arquivo `worker.js` deste repositório.
3. Em **Settings → Variables and Secrets**, crie um secret chamado `GEMINI_API_KEY` e cole nele sua chave do Google AI Studio.
4. Faça **Deploy** e copie a URL pública do Worker (termina em `.workers.dev`).
5. Abra o Pechinchei Reels Studio, na seção **Produto e identidade**, cole essa URL em **URL do backend Gemini** e toque em **Salvar URL**.
6. Envie um vídeo e toque em **Analisar vídeo com Gemini**.

A análise captura até quatro quadros do trecho selecionado no próprio navegador e envia somente essas imagens ao Worker. O Worker chama `gemini-2.5-flash` usando o secret e devolve sugestões de nome, categoria, headline e benefícios. Confira tudo antes de publicar: a IA pode errar.

Se alterar o domínio do GitHub Pages, atualize também `ALLOWED_ORIGIN` no início de `worker.js` para o novo endereço.
