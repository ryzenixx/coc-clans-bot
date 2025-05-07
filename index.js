// 📦 Importation des modules nécessaires de Discord.js et node-fetch
import {
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder,
    ButtonStyle, InteractionType, ComponentType, ModalBuilder,
    TextInputBuilder, TextInputStyle
} from 'discord.js';
import fetch from 'node-fetch';

// 🔐 Variables de configuration (à remplacer avec vos informations)
const DISCORD_TOKEN = 'LE TOKEN DE VOTRE BOT';
const CHANNEL_WARS_ID = 'ID DU SALON DANS LE QUEL LE BOT ENVERRA LE MESSAGE DES GUERRES DE CLAN';
const CHANNEL_MEMBERS_ID = 'ID DU SALON DANS LE QUEL LE BOT ENVERRA LE MESSAGE DES MEMBRES DU CLAN';
const COC_API_TOKEN = 'VOTRE TOKEN CLASH OF CLAN DEVELOPER';
const CLAN_TAG = 'LE TAG DE VOTRE CLAN SANS LE #'
const REFRESH_INTERVAL = 30 * 1000; // ⏳ 30 secondes entre chaque mise à jour

// 🤖 Initialisation du client Discord
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

let lastWarMessageId = null;         // 🕓 ID du dernier message de guerre envoyé (pour l’éditer ensuite)
let lastMembersMessageId = null;  // 🕓 ID du dernier message de membres envoyé

// 🟢 Dès que le bot est prêt
client.once('ready', async () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    const channel = await client.channels.fetch(CHANNEL_WARS_ID);
    if (!channel) return console.error('❌ Canal introuvable');

    // 📊 Fonction pour mettre à jour les infos de guerre
    const updateWar = async () => {
        const res = await fetch(`https://api.clashofclans.com/v1/clans/%23${CLAN_TAG}/currentwar`, {
            headers: { Authorization: `Bearer ${COC_API_TOKEN}` }
        });

        let embed;
        if (!res.ok) {
            // ❗ Si une erreur survient lors de la requête à l’API
            const errorMessage = await res.text();
            console.error('Code erreur HTTP:', res.status);
            console.error('Détail de l\'erreur:', errorMessage);

            embed = new EmbedBuilder()
                .setDescription("❌ **Une erreur est survenue lors de la récupération des données du clan**")
                .setColor("#ff6161")
                .setTimestamp();
        } else {
            const data = await res.json();

            // 😴 Cas où il n’y a pas de guerre en cours
            if (data.state === 'notInWar') {
                embed = new EmbedBuilder()
                    .setTitle('😴 Aucune guerre de clan en cours')
                    .setDescription(`Le clan n’est pas en guerre actuellement.`)
                    .setColor("#84e3c9")
                    .setTimestamp();
            } else {
                // ⚔️ Informations sur la guerre en cours ou terminée
                const clan = data.clan;
                const opponent = data.opponent;

                let state = '⚙️ Préparation';
                if (data.state === 'inWar') state = '⚔️ Guerre en cours';
                else if (data.state === 'warEnded') state = '🏁 Guerre terminée';

                // 🕓 Formatage de l’heure de fin
                const endTimeStr = data.endTime;
                const formattedEndTime = `${endTimeStr.substring(0, 4)}-${endTimeStr.substring(4, 6)}-${endTimeStr.substring(6, 8)}T${endTimeStr.substring(9, 11)}:${endTimeStr.substring(11, 13)}:${endTimeStr.substring(13, 15)}.${endTimeStr.substring(16, 19)}Z`;
                let endTime = new Date(formattedEndTime);

                if (isNaN(endTime.getTime())) {
                    embed = new EmbedBuilder()
                        .setDescription("❌ **Erreur de format de date de fin de guerre**")
                        .setColor("#ff6161")
                        .setTimestamp();
                } else {
                    const endTimestamp = Math.floor(endTime.getTime() / 1000);

                    // 📊 Statistiques des attaques
                    const clanAttacks = data.clan.members?.reduce((total, m) => total + (m.attacks?.length || 0), 0) || 0;
                    const opponentAttacks = data.opponent.members?.reduce((total, m) => total + (m.attacks?.length || 0), 0) || 0;

                    embed = new EmbedBuilder()
                        .setTitle(`${state}: ${clan.name} vs ${opponent.name}`)
                        .setColor("#ff9e7f")
                        .setThumbnail(clan.badgeUrls?.large)
                        .setDescription(`## ${clan.name}
                            ⭐ **${clan.stars} étoiles**
                            🎯 **${clan.destructionPercentage}%** de destruction
                            🗡️ **${clanAttacks} attaques**
                            👥 **${data.clan.members.length} membres**

                            ## ${opponent.name}
                            ⭐ **${opponent.stars} étoiles**
                            🎯 **${opponent.destructionPercentage}%** de destruction
                            🗡️ **${opponentAttacks} attaques**
                            👥 **${data.opponent.members.length} membres**

                            **⏳ Fin de la guerre** <t:${endTimestamp}:R>`)
                        .setFooter({ text: `COC Clan Bot` })
                        .setTimestamp();
                }
            }
        }

        // 🔁 Envoi ou édition du message dans le salon
        try {
            if (lastWarMessageId) {
                const msg = await channel.messages.fetch(lastWarMessageId);
                await msg.edit({ embeds: [embed] });
            } else {
                const msg = await channel.send({ embeds: [embed] });
                lastWarMessageId = msg.id;
            }
        } catch (err) {
            console.error('Erreur lors de l’envoi ou mise à jour du message :', err);
        }
    };

    // 👥 Fonction pour mettre à jour la liste des membres
    const updateMembers = async () => {
        const res = await fetch(`https://api.clashofclans.com/v1/clans/%23${CLAN_TAG}`, {
            headers: { Authorization: `Bearer ${COC_API_TOKEN}` }
        });

        const channel = await client.channels.fetch(CHANNEL_MEMBERS_ID);
        if (!channel) return console.error('❌ Canal membres introuvable');
        if (!res.ok) return console.error('Erreur membres:', res.status, await res.text());

        const data = await res.json();
        const members = data.memberList;

        // 🎭 Classement par rôle dans le clan
        const roleMap = { leader: "Chef", coLeader: "Chef-Adjoint", admin: "Aîné", member: "Membre" };
        const roleOrder = ["leader", "coLeader", "admin", "member"];
        const grouped = { leader: [], coLeader: [], admin: [], member: [] };

        for (const member of members) {
            if (grouped[member.role]) grouped[member.role].push(member);
        }

        const embeds = [];

        // 📄 Création des embeds pour chaque rôle
        for (const role of roleOrder) {
            const roleMembers = grouped[role];
            if (roleMembers.length === 0) continue;

            let description = '';
            for (const member of roleMembers) {
                description += `**${member.name}** (${roleMap[member.role]}) \`${member.tag}\`\n`;
                description += `🏆 **Trophées:** ${member.trophies} | 🏠 **HDV:** ${member.townHallLevel} | 📤 **Dons:** ${member.donations} | 📥 **Reçus:** ${member.donationsReceived}\n\n`;
            }

            const embed = new EmbedBuilder()
                .setTitle(`👥 ${roleMap[role]}${roleMembers.length > 1 ? 's' : ''} (${roleMembers.length})`)
                .setColor('#f5829e')
                .setDescription(description)
                .setFooter({ text: `COC Clan Bot` })
                .setTimestamp();

            embeds.push(embed);
        }

        // 🔘 Bouton pour afficher des infos sur un joueur
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('player_info')
                .setLabel('🔍 Infos sur un joueur')
                .setStyle(ButtonStyle.Primary)
        );

        try {
            if (lastMembersMessageId) {
                const msg = await channel.messages.fetch(lastMembersMessageId);
                await msg.edit({ embeds, components: [row] });
            } else {
                const msg = await channel.send({ embeds, components: [row] });
                lastMembersMessageId = msg.id;
            }
        } catch (err) {
            console.error('Erreur lors de l’envoi ou mise à jour des embeds :', err);
        }
    };

    // ⏱️ Démarrage initial + boucle de mise à jour régulière
    await updateWar();
    setInterval(updateWar, REFRESH_INTERVAL);

    await updateMembers();
    setInterval(updateMembers, REFRESH_INTERVAL);
});

// 🎛️ Interaction quand on clique sur le bouton "Infos sur un joueur"
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'player_info') {
        const modal = new ModalBuilder()
            .setCustomId('player_info_modal')
            .setTitle('🔍 Infos d’un joueur');

        const tagInput = new TextInputBuilder()
            .setCustomId('player_tag')
            .setLabel('Tag du joueur (# obligatoire)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(tagInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }
});

// 📬 Interaction quand l’utilisateur envoie le tag dans le formulaire
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== 'player_info_modal') return;

    const tag = interaction.fields.getTextInputValue('player_tag').replace('#', '').toUpperCase();

    const res = await fetch(`https://api.clashofclans.com/v1/players/%23${tag}`, {
        headers: { Authorization: `Bearer ${COC_API_TOKEN}` }
    });

    if (!res.ok) {
        await interaction.reply({
            content: '❌ Joueur introuvable ou erreur d’API. Vérifie le tag.',
            ephemeral: true
        });
        return;
    }

    const player = await res.json();

    const description = `
        👤 **${player.name}** (${player.tag})
        🏆 **Trophées**: ${player.trophies}
        🏠 **Hôtel de ville**: ${player.townHallLevel}
        🏅 **Niveau**: ${player.expLevel}
        🎖️ **Ligue**: ${player.league?.name ?? 'Aucune'}
        📤 **Dons**: ${player.donations}
        📥 **Reçus**: ${player.donationsReceived}
        🛡️ **Clan**: ${player.clan ? `${player.clan.name} (${player.clan.tag})` : 'Aucun'}

        ⚔️ **Victoires en guerre**: ${player.attackWins ?? 0}
        🛡️ **Défenses victorieuses**: ${player.defenseWins ?? 0}

        ⚙️ **Niveau de l'ouvrier**: ${player.builderHallLevel ?? 'Inconnu'}
        🏆 **Trophées ouvrier**: ${player.builderBaseTrophies ?? 0}

        🦸 **Héros maxés**: ${player.heroes?.filter(h => h.level === h.maxLevel).map(h => h.name).join(', ') || 'Aucun'}
        🔥 **Troupes maxées**: ${player.troops?.filter(t => t.level === t.maxLevel).map(t => t.name).join(', ') || 'Aucune'}
    `;

    const embed = new EmbedBuilder()
        .setTitle(`👤 Profil de ${player.name} (${player.tag})`)
        .setColor('#00b0f4')
        .setDescription(description)
        .setThumbnail(player.league?.iconUrls?.medium ?? null)
        .setFooter({ text: `COC Clan Bot` })
        .setTimestamp();

    const url = `https://www.clashofstats.com/players/${tag}`;
    const button = new ButtonBuilder()
        .setLabel("Voir sur Clash of Stats")
        .setEmoji("🏹")
        .setStyle(ButtonStyle.Link)
        .setURL(url);

    const actionrow = new ActionRowBuilder().addComponents(button);

    await interaction.reply({ embeds: [embed], components: [actionrow], ephemeral: true });
});

// 🔐 Connexion du bot
client.login(DISCORD_TOKEN);