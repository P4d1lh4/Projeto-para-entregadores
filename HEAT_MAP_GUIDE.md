# Heat Map de Rotas - Guia de Uso

## Visão Geral

O Heat Map de Rotas é uma funcionalidade avançada que permite visualizar a densidade e padrões das rotas de entrega, identificando áreas de alta concentração de atividade e oportunidades de otimização.

## Funcionalidades Principais

### 1. Visualização do Heat Map
- **Modos de Visualização:**
  - Pontos de Coleta: Mostra apenas locais de pickup
  - Pontos de Entrega: Mostra apenas locais de delivery
  - Ambos: Visualização combinada de coletas e entregas

- **Controles de Intensidade:**
  - Baixa: Raio de 15px, opacidade reduzida
  - Média: Raio de 25px, opacidade balanceada
  - Alta: Raio de 35px, opacidade máxima

- **Opções de Camadas:**
  - Mostrar Pontos: Exibe marcadores individuais em zoom alto
  - Mostrar Rotas: Exibe linhas conectando pickup e delivery

### 2. Análise de Densidade
- **Zonas de Densidade:** Identifica áreas com maior concentração de entregas
- **Eficiência por Entregador:** Analisa performance individual dos motoristas
- **Insights com IA:** Gera recomendações personalizadas usando OpenAI

### 3. Métricas e Analytics
- Taxa de geocodificação dos endereços
- Distribuição por áreas de cobertura
- Performance comparativa entre entregadores
- Identificação de gargalos operacionais

## Configuração Necessária

### 1. Chave da API Mapbox
1. Acesse as **Configurações** no menu lateral
2. Insira sua chave da API Mapbox no campo apropriado
3. Clique em "Salvar Chaves de API"

### 2. Chave da API OpenAI (Opcional)
1. Para funcionalidades de IA, configure a chave OpenAI
2. Acesse **Configurações** > **Chaves de API**
3. Insira sua chave OpenAI e teste a conexão

## Como Usar

### Acessando o Heat Map
1. No menu lateral, clique em **Heat Map**
2. A página carregará automaticamente os dados de entrega disponíveis
3. Configure os controles conforme sua necessidade

### Interpretando o Heat Map
- **Cores Frias (Azul):** Baixa densidade de entregas
- **Cores Intermediárias (Amarelo/Laranja):** Densidade média
- **Cores Quentes (Vermelho):** Alta densidade de entregas

### Usando a Análise de Densidade
1. **Visão Geral:** Métricas principais e insights da IA
2. **Zonas de Densidade:** Lista detalhada das áreas mais ativas
3. **Eficiência por Entregador:** Performance individual dos motoristas

## Requisitos de Dados

### Dados Mínimos Necessários
- Endereços de pickup e delivery
- Identificação dos entregadores
- Coordenadas geográficas (latitude/longitude)

### Melhorias de Qualidade
- **Taxa de Geocodificação > 80%:** Necessária para análise precisa
- **Dados Históricos:** Mínimo de 100 entregas para padrões confiáveis
- **Informações Temporais:** Timestamps para análise de tendências

## Casos de Uso

### 1. Otimização de Rotas
- Identifique corredores de alta densidade
- Agrupe entregas por proximidade geográfica
- Reduza distâncias percorridas

### 2. Planejamento Territorial
- Defina zonas de atuação por entregador
- Identifique áreas de expansão potencial
- Balance carga de trabalho entre equipes

### 3. Análise de Performance
- Compare eficiência entre entregadores
- Identifique necessidades de treinamento
- Otimize alocação de recursos

### 4. Identificação de Gargalos
- Localize áreas problemáticas
- Analise padrões de falha nas entregas
- Implemente melhorias direcionadas

## Limitações e Considerações

### Limitações Técnicas
- Funciona melhor com dados geocodificados
- Requer chave válida da API Mapbox
- Performance pode variar com grandes volumes de dados

### Qualidade dos Dados
- Endereços imprecisos afetam a visualização
- Dados incompletos reduzem a eficácia da análise
- Coordenadas incorretas distorcem os padrões

### Privacidade
- Dados são processados localmente
- Chaves de API são armazenadas no browser
- Nenhuma informação é enviada para servidores externos

## Solução de Problemas

### Heat Map Não Carrega
1. Verifique a chave da API Mapbox nas configurações
2. Confirme se há dados de entrega disponíveis
3. Verifique a taxa de geocodificação dos endereços

### Baixa Qualidade de Visualização
1. Aumente a taxa de geocodificação dos endereços
2. Verifique a precisão das coordenadas
3. Ajuste as configurações de intensidade

### IA Insights Não Funcionam
1. Configure a chave da API OpenAI
2. Teste a conexão nas configurações
3. Verifique se há dados suficientes para análise

## Próximos Passos

### Melhorias Planejadas
- Filtros temporais avançados
- Análise de tendências sazonais
- Integração com sistemas de roteamento
- Exportação de relatórios automáticos

### Integrações Futuras
- APIs de tráfego em tempo real
- Previsão de demanda com machine learning
- Otimização automática de rotas
- Alertas proativos de performance

## Suporte

Para questões técnicas ou sugestões de melhorias:
1. Verifique a documentação técnica
2. Consulte os logs do navegador para erros
3. Entre em contato com a equipe de desenvolvimento 

🕒 Registro 1 - Collected Waiting Time encontrado: { valor: "01:23:45", tipo: "string", isHHMMSSFormat: true }
🚚 Registro 1 - Delivered Waiting Time encontrado: { valor: "00:45:30", tipo: "string", isHHMMSSFormat: true }
🔍 [Collection Time] Valores encontrados: [{ id: "del-1", raw: "01:23:45", minutes: 83.75 }]
🔍 [Delivery Time] Valores encontrados: [{ id: "del-1", raw: "00:45:30", minutes: 45.5 }]
🎯 [Collection Time] Remoção de outliers: { outliersRemovidos: 2 }
🎯 [Delivery Time] Remoção de outliers: { outliersRemovidos: 1 } 