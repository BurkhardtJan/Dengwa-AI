import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {GAME_REGISTRY} from "@/games/shared/gameRegistry";

export default function GamesPage() {
    const {t} = useTranslation('game');

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-xl font-semibold mb-6">{t("overview.title")}</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {GAME_REGISTRY.map((game) => (
                    <Link
                        key={game.id}
                        to={game.path}
                        className="flex flex-col items-center justify-center gap-2 rounded-lg border p-6 hover:bg-muted/50 transition-colors"
                    >
                        <span className="text-3xl">{game.icon}</span>
                        <span className="font-medium">{t(game.titleKey)}</span>
                        <span className="text-sm text-muted-foreground text-center">
              {t(game.descriptionKey)}
            </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}