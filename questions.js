export const questions = [
  {
    "q": "O PC liga, mas o monitor diz “sem sinal”. Qual teste vem primeiro?",
    "a": [
      "Reinstalar o driver gráfico",
      "Testar outro cabo ou entrada",
      "Remover a memória RAM",
      "Atualizar o firmware UEFI"
    ],
    "c": 1,
    "e": "Comece isolando monitor, entrada e cabo antes de suspeitar de peças internas."
  },
  {
    "q": "O LED “DRAM” permanece aceso e o PC não conclui o POST. Onde investigar?",
    "a": [
      "Arquivos de inicialização",
      "Conector de rede RJ-45",
      "Partição do SSD",
      "RAM, slots e compatibilidade"
    ],
    "c": 3,
    "e": "O indicador DRAM aponta a etapa de inicialização da memória; consulte também o manual da placa."
  },
  {
    "q": "Dois pentes de RAM funcionam sozinhos, mas falham juntos. O que conferir?",
    "a": [
      "Compatibilidade e configuração",
      "Integridade do cabo HDMI",
      "Saúde SMART do SSD",
      "Atualização do antivírus"
    ],
    "c": 0,
    "e": "Módulos, slots e parâmetros de memória podem causar falha somente quando usados juntos."
  },
  {
    "q": "A BIOS detecta o SSD, mas mostra “No bootable device”. Qual teste faz sentido?",
    "a": [
      "Reinstalar o driver de som",
      "Trocar o cabo do monitor",
      "Conferir ordem e modo de boot",
      "Testar a bateria do mouse"
    ],
    "c": 2,
    "e": "A unidade detectada pode não conter uma inicialização válida ou estar fora da ordem de boot."
  },
  {
    "q": "Os setores realocados do HD aumentam nos relatórios SMART. Qual prioridade?",
    "a": [
      "Desfragmentar várias vezes",
      "Salvar os dados importantes",
      "Aumentar a memória virtual",
      "Reduzir a resolução da tela"
    ],
    "c": 1,
    "e": "O aumento desses indicadores pode sinalizar degradação da unidade; proteja os dados primeiro."
  },
  {
    "q": "Durante jogos, a CPU atinge temperatura alta e reduz o clock. O que avaliar?",
    "a": [
      "Cooler e dissipação térmica",
      "Sistema de arquivos do SSD",
      "Configuração do endereço IP",
      "Versão do driver de áudio"
    ],
    "c": 0,
    "e": "Thermal throttling reduz o desempenho para controlar a temperatura; confira o sistema térmico."
  },
  {
    "q": "O PC só reinicia quando a GPU exige muita energia. Qual hipótese testar?",
    "a": [
      "Falha no teclado USB",
      "Erro no fuso horário",
      "Problema na rede Wi-Fi",
      "Fonte instável sob carga"
    ],
    "c": 3,
    "e": "Problemas de alimentação podem aparecer sob maior consumo; testes devem ser seguros e supervisionados."
  },
  {
    "q": "A imagem mostra artefatos apenas em jogos 3D. Qual investigação é mais útil?",
    "a": [
      "Trocar todos os periféricos",
      "Formatar sem diagnóstico",
      "Checar GPU, driver e calor",
      "Ajustar somente o volume"
    ],
    "c": 2,
    "e": "Falhas gráficas sob carga podem envolver GPU, temperatura ou software, sem diagnóstico imediato de peça queimada."
  },
  {
    "q": "No modo de segurança há imagem normal, mas no Windows comum ela falha. Onde começar?",
    "a": [
      "Configurações do teclado",
      "Driver e modo de vídeo",
      "Ventoinha da fonte ATX",
      "Bateria da placa-mãe"
    ],
    "c": 1,
    "e": "O modo de segurança utiliza configurações básicas; drivers e ajustes de vídeo são hipóteses relevantes."
  },
  {
    "q": "As USB traseiras funcionam; as dianteiras, não. Qual verificação isola a falha?",
    "a": [
      "Cabo do painel USB frontal",
      "Pasta térmica do processador",
      "Taxa de atualização da tela",
      "Modo de inicialização do SSD"
    ],
    "c": 0,
    "e": "Portas frontais dependem do painel e de sua ligação interna à placa-mãe."
  },
  {
    "q": "A hora do PC sempre volta errada após dias desconectado. Qual suspeita?",
    "a": [
      "Firmware da placa de vídeo",
      "Driver do adaptador de rede",
      "Cabo de alimentação SATA",
      "Bateria do relógio RTC"
    ],
    "c": 3,
    "e": "Uma bateria RTC enfraquecida pode causar perda de data e hora ao retirar a energia."
  },
  {
    "q": "Um SSD NVMe não aparece em um slot M.2. Qual item confirmar?",
    "a": [
      "Frequência de atualização do monitor",
      "Senha de login do Windows",
      "Compatibilidade do slot M.2",
      "Quantidade de portas USB livres"
    ],
    "c": 2,
    "e": "Nem todo slot M.2 suporta todos os protocolos ou tipos de unidade."
  },
  {
    "q": "A internet cabeada funciona, mas o Wi-Fi não conecta. Qual foco inicial?",
    "a": [
      "Bateria RTC e relógio",
      "Adaptador, sinal e configuração",
      "Temperatura do processador",
      "Ordem de boot do sistema"
    ],
    "c": 1,
    "e": "O funcionamento pelo cabo ajuda a direcionar o teste ao caminho específico do Wi-Fi."
  },
  {
    "q": "Um HD emite cliques anormais e falha ao abrir arquivos. O que evitar?",
    "a": [
      "Realizar cópia dos arquivos",
      "Verificar dados SMART",
      "Procurar ajuda especializada",
      "Insistir em testes intensivos"
    ],
    "c": 3,
    "e": "Testes pesados podem piorar um disco com falha; priorize cópia segura dos dados."
  },
  {
    "q": "O PC fica lento e a CPU permanece em clock baixo com 95 °C. Qual sinal?",
    "a": [
      "Limitação térmica do processador",
      "Erro de autenticação do Wi-Fi",
      "Desgaste do conector HDMI",
      "Falha da pilha do teclado"
    ],
    "c": 0,
    "e": "Temperatura muito alta acompanhada de clock reduzido é típica de proteção térmica."
  },
  {
    "q": "Após conectar um dispositivo USB, o PC trava; sem ele, funciona. Qual ação inicial?",
    "a": [
      "Substituir a fonte sem testes",
      "Atualizar o firmware sem verificar",
      "Isolar o dispositivo e a porta",
      "Desativar a placa de vídeo"
    ],
    "c": 2,
    "e": "Comparar o mesmo dispositivo em outras portas e outros dispositivos na porta ajuda a localizar a origem."
  },
  {
    "q": "Ao iniciar, a placa-mãe emite uma sequência de bipes. Como interpretar?",
    "a": [
      "Consultar o manual do modelo",
      "Aplicar uma tabela universal",
      "Reinstalar o navegador",
      "Limpar o SSD imediatamente"
    ],
    "c": 0,
    "e": "Códigos de beep dependem do fabricante, BIOS e modelo; não há uma tabela única confiável."
  },
  {
    "q": "O PC reconhece só metade da RAM instalada. O que verificar?",
    "a": [
      "Brilho e contraste do monitor",
      "Nome do perfil de usuário",
      "Versão do aplicativo de música",
      "Slots, limite e configuração"
    ],
    "c": 3,
    "e": "O reconhecimento depende do módulo, slots, suporte da placa e configurações do sistema."
  },
  {
    "q": "Após instalar um driver, começaram telas azuis. Qual primeiro caminho?",
    "a": [
      "Trocar a placa-mãe",
      "Formatar todos os discos",
      "Reverter o driver recente",
      "Comprar outra fonte ATX"
    ],
    "c": 2,
    "e": "A coincidência com a alteração torna a reversão do driver um teste menos invasivo."
  },
  {
    "q": "O PC perde acesso só a uma porta USB. Qual teste diferencia as causas?",
    "a": [
      "Alterar a taxa de atualização",
      "Testar outro dispositivo nela",
      "Substituir a memória RAM",
      "Reinstalar o sistema inteiro"
    ],
    "c": 1,
    "e": "Testar outro dispositivo na mesma porta ajuda a distinguir defeito da porta de problema no periférico."
  }
];
