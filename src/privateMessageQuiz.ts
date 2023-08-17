import { ChannelType, Client, Message } from "discord.js";

// Map to store user question state in RAM
const userQuestionState = new Map<
  string,
  { state: number; info: Record<string, string | boolean> }
>();

export const handlePrivateMessageQuiz = async (
  msg: Message,
  client: Client
) => {
  if (msg.channel.type !== ChannelType.DM) return;

  const user = msg.author;
  const content = msg.content.toLowerCase();
  const guild = client.guilds.cache.get(process.env.GUILD_ID || "");
  const member = guild?.members.cache.get(user.id);

  if (msg.author.bot) {
    const userId = msg.author.id;
    if (userQuestionState.get(userId)) return;

    const userState = {
      state: 1,
      info: {},
    };
    userQuestionState.set(userId, userState);

    msg.channel.send(
      `Question 1 :  quel est la technologies préférer de Melvyn ? (React / VueJS / Angular / Svelte) ?
      
Répond uniquement par le nom de la technologie sans aucune autre information.`
    );

    return;
  }

  if (!member) {
    msg.channel.send("You are not a member of the server.");
    return;
  }

  // Get or set the question state from the map using user's ID
  let userState = userQuestionState.get(user.id) || { state: 1, info: {} };
  let questionState = userState.state;

  switch (questionState) {
    case 1:
      if (content === "react") {
        userState.state = 2;
        userQuestionState.set(user.id, userState);
        msg.channel.send(
          `Bravo ! Tu as réussi la première question.
          
Question 2 : quel est l’erreur dans ce code ?
\`\`\`
const fn = () = "I\'m a function"
\`\`\`
**a)** il manque console.log
**b)** il manque l’arrow (⇒) dans la function
**c)** il faut utiliser let
**d)** aucune erreur

Répond par a, b, c ou d **uniquement**.
`
        );
      } else {
        msg.channel.send("You failed. Goodbye.");

        setTimeout(() => {
          member
            .kick("Failed the quiz.")
            .catch((err: unknown) =>
              console.log("Failed to kick member due to: ", err)
            );
        }, 500);
        userQuestionState.delete(user.id);
      }
      break;

    case 2:
      if (content === "b") {
        userState.state = 3;
        userQuestionState.set(user.id, userState);
        msg.channel.send(
          `Bravo ! Tu as réussi la deuxième question. Maintenant j'ai besoin encore toi de 2 minutes pour un peu mieux te connaître et t'ajouter les bons rôles.
          
Présente ce que tu fais actuellement en 1 phrases (minimum 26 caractères) :`
        );
      } else {
        msg.channel.send(
          "Tu as échoué. Je suis contraint de kick ! Au revoir."
        );
        setTimeout(() => {
          member
            .kick("Failed the quiz.")
            .catch((err: unknown) =>
              console.log("Failed to kick member due to: ", err)
            );
        }, 500);
        userQuestionState.delete(user.id);
      }
      break;
    case 3:
      if (content.length >= 26) {
        userState.state = 4;
        userState.info.currentActivity = content;
        userQuestionState.set(user.id, userState);
        msg.channel.send(
          "Présente ce que tu faisant avant en 1 phrases (minimum 26 caractères)"
        );
      } else {
        msg.channel.send("Votre réponse doit avoir au moins 26 caractères.");
      }
      break;
    case 4:
      if (content.length >= 26) {
        userState.state = 5;
        userState.info.previousActivity = content;
        userQuestionState.set(user.id, userState);
        msg.channel.send(
          "Question 4 : es-tu intéressé par le freelance ? (oui / non)"
        );
      } else {
        msg.channel.send("Votre réponse doit avoir au moins 26 caractères.");
      }
      break;

    case 5:
      if (content === "oui" || content === "non") {
        if (content === "oui") {
          member?.roles.add("1141597909767438397");
        }
        userState.state = 6;
        userState.info.freelance = true;
        userQuestionState.set(user.id, userState);
        msg.channel.send(
          "Question 5 : aimerais-tu créer un SaaS (Software as a Service) ? (oui / non)"
        );
      } else {
        msg.channel.send(
          "Réponse invalide. Veuillez répondre par 'oui' ou 'non'."
        );
      }
      break;

    case 6:
      if (content === "oui" || content === "non") {
        if (content === "oui") {
          member?.roles.add("1141597934450905128");
        }
        userState.state = 7; // Move to next question or end of quiz
        userState.info.indie = true;
        userQuestionState.set(user.id, userState);
        msg.channel.send(
          "Question 6 : aimerais-tu créer du contenu (blog, vidéos, etc.) ? (oui / non)"
        );
      } else {
        msg.channel.send(
          "Réponse invalide. Veuillez répondre par 'oui' ou 'non'."
        );
      }
      break;
    case 7:
      if (content === "oui" || content === "non") {
        if (content === "oui") {
          member?.roles.add("1141597957666373643");
        }
        userState.info.creator = true;

        userState.state = 8;
        msg.channel.send(
          "Question 7 : aimerais-tu être notifié quand Melvyn à besoin de toi ?"
        );
      } else {
        msg.channel.send(
          "Réponse invalide. Veuillez répondre par 'oui' ou 'non'."
        );
      }

      break;
    case 8:
      if (content === "oui") {
        member?.roles.add("1141597501258997810");
      }

      msg.channel.send("Merci ! Tu as maintenant accès au serveur.");
      member?.roles.add("1141600989808443423");

      const welcomeChannel = guild?.channels.cache.get("1141597624064032870");
      if (welcomeChannel?.type === ChannelType.GuildText) {
        const finalMessage = `🔔 Nouveau lynx !

Bienvenue <@${user.id}> sur le serveur ! 🎉

Voici quelques informations pour mieux savoir ce qu'il fait et ce qu'il aime :

**Activité actuelle**
${userState.info.currentActivity}

**Ancienne activité**
${userState.info.previousActivity}

Il est intéressé par : ${userState.info.freelance ? "\n 👨‍💻 Freelance" : ""}${
          userState.info.indie ? "\n 🚀 Création de SaaS" : ""
        }${userState.info.creator ? "\n 📝 Création de contenu" : ""}

Dites lui bienvenue ! 🎉`;
        const message = await welcomeChannel.send(finalMessage);
        // create a thread under the message
        const thread = await message.startThread({
          name: `Bienvenue ${user.username}`,
          autoArchiveDuration: 1440,
        });
        thread.send(`Bienvenue <@${user.id}> ❤️ (de Melvynx)`);
      }

      userQuestionState.delete(user.id);
      break;

    default:
      msg.channel.send("Invalid state.");
  }
};
