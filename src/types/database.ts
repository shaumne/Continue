export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          key: string
          target: number
          title: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: string
          key: string
          target?: number
          title: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          key?: string
          target?: number
          title?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          content_item_id: string | null
          created_at: string
          delta: number
          event: Database["public"]["Enums"]["activity_event"]
          id: string
          user_id: string
        }
        Insert: {
          content_item_id?: string | null
          created_at?: string
          delta?: number
          event: Database["public"]["Enums"]["activity_event"]
          id?: string
          user_id: string
        }
        Update: {
          content_item_id?: string | null
          created_at?: string
          delta?: number
          event?: Database["public"]["Enums"]["activity_event"]
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          cover_url: string | null
          created_at: string
          external_id: string
          external_source: Database["public"]["Enums"]["external_source"]
          id: string
          metadata: Json
          title: string
          type: Database["public"]["Enums"]["content_type"]
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          external_id: string
          external_source: Database["public"]["Enums"]["external_source"]
          id?: string
          metadata?: Json
          title: string
          type: Database["public"]["Enums"]["content_type"]
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          external_id?: string
          external_source?: Database["public"]["Enums"]["external_source"]
          id?: string
          metadata?: Json
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
        }
        Relationships: []
      }
      quests: {
        Row: {
          active: boolean
          content_type: Database["public"]["Enums"]["content_type"] | null
          description: string | null
          id: string
          scope: Database["public"]["Enums"]["quest_scope"]
          target: number
          title: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          content_type?: Database["public"]["Enums"]["content_type"] | null
          description?: string | null
          id?: string
          scope: Database["public"]["Enums"]["quest_scope"]
          target: number
          title: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          content_type?: Database["public"]["Enums"]["content_type"] | null
          description?: string | null
          id?: string
          scope?: Database["public"]["Enums"]["quest_scope"]
          target?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_items: {
        Row: {
          completed_at: string | null
          content_item_id: string
          id: string
          last_activity_at: string | null
          notes: string | null
          platform: string | null
          progress_current: number | null
          progress_detail: Json
          progress_total: number | null
          rating: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["item_status"]
          time_spent_minutes: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content_item_id: string
          id?: string
          last_activity_at?: string | null
          notes?: string | null
          platform?: string | null
          progress_current?: number | null
          progress_detail?: Json
          progress_total?: number | null
          rating?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          time_spent_minutes?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content_item_id?: string
          id?: string
          last_activity_at?: string | null
          notes?: string | null
          platform?: string | null
          progress_current?: number | null
          progress_detail?: Json
          progress_total?: number | null
          rating?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          time_spent_minutes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_items_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          current_streak: number
          daily_time_budget_minutes: number | null
          last_activity_date: string | null
          level: number
          longest_streak: number
          user_id: string
          xp: number
        }
        Insert: {
          current_streak?: number
          daily_time_budget_minutes?: number | null
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          user_id: string
          xp?: number
        }
        Update: {
          current_streak?: number
          daily_time_budget_minutes?: number | null
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_quests: {
        Row: {
          completed_at: string | null
          id: string
          period_key: string
          progress: number
          quest_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          period_key: string
          progress?: number
          quest_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          period_key?: string
          progress?: number
          quest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_event: "start" | "progress" | "complete" | "rate"
      content_type:
        | "game"
        | "movie"
        | "tv"
        | "book"
        | "anime"
        | "podcast"
        | "youtube"
        | "course"
      external_source: "tmdb" | "anilist" | "igdb" | "steam" | "google_books"
      item_status: "backlog" | "started" | "paused" | "completed" | "dropped"
      quest_scope: "daily" | "weekly" | "challenge"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_event: ["start", "progress", "complete", "rate"],
      content_type: [
        "game",
        "movie",
        "tv",
        "book",
        "anime",
        "podcast",
        "youtube",
        "course",
      ],
      external_source: ["tmdb", "anilist", "igdb", "steam", "google_books"],
      item_status: ["backlog", "started", "paused", "completed", "dropped"],
      quest_scope: ["daily", "weekly", "challenge"],
    },
  },
} as const
