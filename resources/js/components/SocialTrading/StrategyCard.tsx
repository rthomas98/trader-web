// resources/js/components/SocialTrading/StrategyCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react"; // Or another relevant icon

interface Strategy {
    id: number;
    name: string;
    description: string | null;
}

interface StrategyCardProps {
    strategy: Strategy;
}

export function StrategyCard({ strategy }: StrategyCardProps) {
    return (
        <Card className="w-full transition-shadow duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">{strategy.name}</CardTitle>
                <BrainCircuit className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {strategy.description ? (
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                ) : (
                    <p className="text-sm text-muted-foreground italic">No description provided.</p>
                )}
            </CardContent>
        </Card>
    );
}
