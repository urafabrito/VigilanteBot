require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const relatorioCanalId = '1382835341098090637';

const dados = {};

client.on('ready', () => {
  console.log(`✅ Bot iniciado como ${client.user.tag}`);
});

client.on('voiceStateUpdate', (oldState, newState) => {
  const userId = newState.id;
  const username = newState.member.user.tag;
  const agora = Date.now();
  const guildId = newState.guild.id;

  if (!dados[guildId]) dados[guildId] = {};
  if (!dados[guildId][userId]) dados[guildId][userId] = [];

  if (!oldState.channelId && newState.channelId) {
    dados[guildId][userId].push({
      nome: username,
      canal: newState.channel.name,
      entrada: agora,
      saida: null
    });
  }

  if (oldState.channelId && !newState.channelId) {
    const logs = dados[guildId][userId];
    const ultima = logs?.find(s => s.saida === null);
    if (ultima) ultima.saida = agora;
  }
});

// Agendamento diário às 23h horário de Brasília
cron.schedule('0 23 * * *', async () => {
  for (const guildId in dados) {
    let relatorio = `📊 **Relatório de Voz – ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}**\n\n`;

    for (const userId in dados[guildId]) {
      const logs = dados[guildId][userId];
      let totalSegundos = 0;

      logs.forEach(s => {
        if (s.saida) {
          const tempo = Math.floor((s.saida - s.entrada) / 1000);
          totalSegundos += tempo;
          relatorio += `👤 ${s.nome} – ${s.canal} – ${tempo}s\n`;
        }
      });

      if (totalSegundos > 0) {
        const minutos = Math.floor(totalSegundos / 60);
        relatorio += `➡️ Total: ${minutos} minutos\n\n`;
      }
    }

    const canal = await client.channels.fetch(relatorioCanalId);
    if (canal) canal.send(relatorio);
  }

  // Limpa os dados após envio
  for (const g in dados) delete dados[g];
}, {
  timezone: 'America/Sao_Paulo'
});

client.on('messageCreate', async (message) => {
  if (message.content === '!relatorio') {
    const guildId = message.guild.id;
    if (!dados[guildId]) return message.channel.send('Nenhum dado registrado.');

    let relatorio = `📊 **Relatório Manual – ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}**\n\n`;

    for (const userId in dados[guildId]) {
      const logs = dados[guildId][userId];
      let totalSegundos = 0;

      logs.forEach(s => {
        if (s.saida) {
          const tempo = Math.floor((s.saida - s.entrada) / 1000);
          totalSegundos += tempo;
          relatorio += `👤 ${s.nome} – ${s.canal} – ${tempo}s\n`;
        }
      });

      if (totalSegundos > 0) {
        const minutos = Math.floor(totalSegundos / 60);
        relatorio += `➡️ Total: ${minutos} minutos\n\n`;
      }
    }

    message.channel.send(relatorio || 'Nenhum registro encontrado.');
  }
});

client.login(process.env.TOKEN);