import { createFileRoute } from "@tanstack/react-router";
import { Kiosk } from "@/components/kiosk/Kiosk";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MYNUS 360 — Self-Order Kiosk | Mitha Bazar, Jalandhar" },
      { name: "description", content: "Order burgers, pizza, momos, shakes and more at MYNUS 360. Good Food • Great Mood." },
      { property: "og:title", content: "MYNUS 360 — Self-Order Kiosk" },
      { property: "og:description", content: "Good Food • Great Mood. Tap to start your order at MYNUS 360, Jalandhar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Kiosk,
});
