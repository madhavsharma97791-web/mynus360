import { createFileRoute } from "@tanstack/react-router";
import { Kiosk } from "@/components/kiosk/Kiosk";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { publicMenu } from "@/lib/menu.functions";

const menuQuery = queryOptions({queryKey:["public-menu"],queryFn:()=>publicMenu(),refetchInterval:30000});

export const Route = createFileRoute("/")({
  loader:({context})=>context.queryClient.ensureQueryData(menuQuery),
  head: () => ({
    meta: [
      { title: "Mynus 360" },
      { name: "description", content: "Order burgers, pizza, momos, shakes and more at MYNUS 360. Good Food • Great Mood." },
      { property: "og:title", content: "MYNUS 360 — Self-Order Kiosk" },
      { property: "og:description", content: "Good Food • Great Mood. Tap to start your order at MYNUS 360, Jalandhar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => { const {data}=useSuspenseQuery(menuQuery);return <Kiosk menu={data} />; },
});
