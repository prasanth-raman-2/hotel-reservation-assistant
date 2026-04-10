import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, CalendarCheck, ShieldCheck, FileText } from "lucide-react";

const features = [
  {
    title: "Chat with AI Assistant",
    description:
      "Ask questions about the hotel - food, facilities, policies, hygiene, and more. Get instant answers powered by our hotel documentation.",
    icon: MessageSquare,
    href: "/chat",
    cta: "Start Chatting",
  },
  {
    title: "Manage Bookings",
    description:
      "Create, view, and cancel reservations directly. All bookings sync with the chat assistant in real time.",
    icon: CalendarCheck,
    href: "/bookings",
    cta: "Manage Bookings",
  },
  {
    title: "Privacy Protected",
    description:
      "Your personal information is handled with care. We never expose guest data and follow responsible PII handling practices.",
    icon: ShieldCheck,
    href: "/chat",
    cta: "Learn More",
  },
  {
    title: "Document-Grounded Answers",
    description:
      "All hotel information comes directly from our official documentation. No hallucinated or made-up answers.",
    icon: FileText,
    href: "/chat",
    cta: "Ask a Question",
  },
];

export default function Home() {
  return (
    <div className="container py-10">
      <section className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
        <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
          Hotel Reservation Assistant
        </h1>
        <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
          Your AI-powered concierge. Ask about our hotel, make reservations, or get help with your stay.
        </p>
        <div className="py-4 md:pb-10">
          <Button size="lg" asChild>
            <Link href="/chat">Start Chatting</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl pb-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="flex flex-col">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild className="w-full">
                    <Link href={f.href}>{f.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
