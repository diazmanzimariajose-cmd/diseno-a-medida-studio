import type { Conversation, DialogueLine, SceneId, Speaker } from "./types";

type Raw = [Speaker, string, string];

function conv(id: string, title: string, topic: string, scene: SceneId, raw: Raw[]): Conversation {
  const lines: DialogueLine[] = raw.map(([speaker, en, es], i) => ({
    id: `${id}-${i + 1}`,
    speaker,
    en,
    es,
  }));
  return { id, title, topic, scene, starter: lines[0]?.speaker ?? "male", lines, updatedAt: 0 };
}

export const DEFAULT_CONVERSATIONS: Conversation[] = [
  conv("greeting", "Good morning, welcome!", "Greeting customers", "cafe", [
    [
      "male",
      "Good morning, Sofía! Are you ready for today's shift?",
      "¡Buenos días, Sofía! ¿Estás lista para el turno de hoy?",
    ],
    [
      "female",
      "Good morning, Daniel! Yes, the café is ready to open.",
      "¡Buenos días, Daniel! Sí, la cafetería está lista para abrir.",
    ],
    [
      "male",
      "Great. Remember to greet every customer with a smile.",
      "Genial. Recuerda saludar a cada cliente con una sonrisa.",
    ],
    [
      "female",
      "Of course. Welcome to Arte y Pasión Café! How can I help you today?",
      "¡Claro! ¡Bienvenido a Arte y Pasión Café! ¿En qué le puedo ayudar hoy?",
    ],
    [
      "male",
      "Perfect! That sounds warm and professional.",
      "¡Perfecto! Eso suena cálido y profesional.",
    ],
  ]),
  conv("order", "Taking an order", "Taking orders", "bar", [
    ["female", "Hi! What would you like to order?", "¡Hola! ¿Qué le gustaría ordenar?"],
    ["male", "I'd like a large cappuccino, please.", "Me gustaría un capuchino grande, por favor."],
    [
      "female",
      "Sure. Would you like whole milk or almond milk?",
      "Claro. ¿Lo quiere con leche entera o con leche de almendras?",
    ],
    [
      "male",
      "Almond milk, please. And one croissant.",
      "Leche de almendras, por favor. Y un croissant.",
    ],
    ["female", "Is that for here or to go?", "¿Es para tomar aquí o para llevar?"],
    ["male", "For here, thank you.", "Para tomar aquí, gracias."],
    ["female", "Your total is twelve thousand pesos.", "Su total es de doce mil pesos."],
  ]),
  conv("prepare", "Preparing a latte", "Preparing drinks", "bar", [
    [
      "male",
      "Sofía, can you show me how to prepare a latte?",
      "Sofía, ¿me puedes mostrar cómo preparar un latte?",
    ],
    [
      "female",
      "Sure! First, we grind the coffee beans fresh.",
      "¡Claro! Primero, molemos los granos de café frescos.",
    ],
    [
      "female",
      "Then we pull a double shot of espresso.",
      "Luego sacamos una doble carga de espresso.",
    ],
    ["male", "How hot should the milk be?", "¿Qué tan caliente debe estar la leche?"],
    [
      "female",
      "About sixty-five degrees. We steam it until it's silky.",
      "Unos sesenta y cinco grados. La vaporizamos hasta que quede sedosa.",
    ],
    [
      "male",
      "And finally, we pour it slowly to make latte art.",
      "Y finalmente, la vertimos despacio para hacer arte latte.",
    ],
  ]),
  conv("recommend", "What do you recommend?", "Recommending coffee", "cafe", [
    [
      "female",
      "Daniel, a customer wants something sweet but not too strong.",
      "Daniel, un cliente quiere algo dulce pero no muy fuerte.",
    ],
    [
      "male",
      "I recommend our caramel macchiato. It's smooth and sweet.",
      "Le recomiendo nuestro macchiato de caramelo. Es suave y dulce.",
    ],
    [
      "female",
      "And for someone who loves strong coffee?",
      "¿Y para alguien que ama el café fuerte?",
    ],
    [
      "male",
      "A double espresso or an Americano made with our Colombian beans.",
      "Un espresso doble o un americano preparado con nuestros granos colombianos.",
    ],
    [
      "female",
      "Great choices. Our beans have notes of chocolate and orange.",
      "Excelentes opciones. Nuestros granos tienen notas de chocolate y naranja.",
    ],
  ]),
  conv("methods", "Brewing methods", "Explaining preparation methods", "bar", [
    [
      "male",
      "Do you know the difference between a French press and a V60?",
      "¿Sabes la diferencia entre una prensa francesa y un V60?",
    ],
    [
      "female",
      "Yes. The French press steeps the coffee for about four minutes.",
      "Sí. La prensa francesa deja reposar el café unos cuatro minutos.",
    ],
    ["female", "It makes a full-bodied cup.", "Produce una taza con mucho cuerpo."],
    [
      "male",
      "And the V60 is a pour-over method with a paper filter.",
      "Y el V60 es un método de goteo con filtro de papel.",
    ],
    [
      "female",
      "Exactly. It gives a cleaner and brighter flavor.",
      "Exacto. Da un sabor más limpio y brillante.",
    ],
  ]),
  conv("questions", "Customer questions", "Answering customer questions", "cafe", [
    ["female", "Excuse me, does this cake have nuts?", "Disculpe, ¿este pastel tiene nueces?"],
    [
      "male",
      "No, it doesn't. But the brownie does contain walnuts.",
      "No, no tiene. Pero el brownie sí contiene nueces.",
    ],
    ["female", "Do you have decaf coffee?", "¿Tienen café descafeinado?"],
    [
      "male",
      "Yes, we do. We can prepare any drink with decaf beans.",
      "Sí, tenemos. Podemos preparar cualquier bebida con granos descafeinados.",
    ],
    ["female", "And is there Wi-Fi here?", "¿Y hay wifi aquí?"],
    ["male", "Yes, the password is on your receipt.", "Sí, la contraseña está en su recibo."],
  ]),
  conv("farewell", "Thank you, come again!", "Saying goodbye", "cafe", [
    ["male", "Here is your coffee. Enjoy it!", "Aquí está su café. ¡Que lo disfrute!"],
    [
      "female",
      "Thank you so much. Everything was delicious.",
      "Muchas gracias. Todo estuvo delicioso.",
    ],
    [
      "male",
      "We're glad you liked it. Have a wonderful day!",
      "Nos alegra que le haya gustado. ¡Que tenga un día maravilloso!",
    ],
    ["female", "You too. See you tomorrow!", "Igualmente. ¡Hasta mañana!"],
    [
      "male",
      "Thank you for visiting Arte y Pasión Café. Come again soon!",
      "Gracias por visitar Arte y Pasión Café. ¡Vuelva pronto!",
    ],
  ]),
];

export const FIRST_CONVERSATION = DEFAULT_CONVERSATIONS[0] as Conversation;
