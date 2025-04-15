<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Rename economic_calendar table to economic_calendars
        Schema::rename('economic_calendar', 'economic_calendars');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rename back to original name
        Schema::rename('economic_calendars', 'economic_calendar');
    }
};
