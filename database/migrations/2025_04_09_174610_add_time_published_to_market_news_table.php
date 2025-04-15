<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add time_published column
        Schema::table('market_news', function (Blueprint $table) {
            $table->timestamp('time_published')->nullable()->after('published_at');
        });

        // Copy data from published_at to time_published
        DB::statement('UPDATE market_news SET time_published = published_at');

        // Create a trigger to keep time_published in sync with published_at
        DB::unprepared('
            CREATE OR REPLACE FUNCTION sync_time_published()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.time_published = NEW.published_at;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER sync_time_published_trigger
            BEFORE INSERT OR UPDATE ON market_news
            FOR EACH ROW
            EXECUTE FUNCTION sync_time_published();
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the trigger and function
        DB::unprepared('
            DROP TRIGGER IF EXISTS sync_time_published_trigger ON market_news;
            DROP FUNCTION IF EXISTS sync_time_published();
        ');

        // Drop the column
        Schema::table('market_news', function (Blueprint $table) {
            $table->dropColumn('time_published');
        });
    }
};
