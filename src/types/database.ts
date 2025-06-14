export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          bio: string | null
          learning_goals: string[] | null
          preferred_study_time: Database['public']['Enums']['study_time'] | null
          study_level: Database['public']['Enums']['study_difficulty'] | null
          timezone: string | null
          preferences: Json | null
          stats: Json | null
          created_at: string | null
          updated_at: string | null
          last_login_at: string | null
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          bio?: string | null
          learning_goals?: string[] | null
          preferred_study_time?: Database['public']['Enums']['study_time'] | null
          study_level?: Database['public']['Enums']['study_difficulty'] | null
          timezone?: string | null
          preferences?: Json | null
          stats?: Json | null
          created_at?: string | null
          updated_at?: string | null
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          bio?: string | null
          learning_goals?: string[] | null
          preferred_study_time?: Database['public']['Enums']['study_time'] | null
          study_level?: Database['public']['Enums']['study_difficulty'] | null
          timezone?: string | null
          preferences?: Json | null
          stats?: Json | null
          created_at?: string | null
          updated_at?: string | null
          last_login_at?: string | null
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          duration: string
          difficulty: Database['public']['Enums']['study_difficulty']
          topics: string[] | null
          schedule: Json
          files: Json | null
          progress: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          duration: string
          difficulty: Database['public']['Enums']['study_difficulty']
          topics?: string[] | null
          schedule?: Json
          files?: Json | null
          progress?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          duration?: string
          difficulty?: Database['public']['Enums']['study_difficulty']
          topics?: string[] | null
          schedule?: Json
          files?: Json | null
          progress?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      study_groups: {
        Row: {
          id: string
          name: string
          description: string
          admin_id: string
          admin_name: string
          topic: string
          difficulty: Database['public']['Enums']['study_difficulty']
          is_public: boolean | null
          members: Json | null
          files: Json | null
          study_plan_id: string | null
          member_progress: Json | null
          created_at: string | null
          updated_at: string | null
          last_activity: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          admin_id: string
          admin_name: string
          topic: string
          difficulty: Database['public']['Enums']['study_difficulty']
          is_public?: boolean | null
          members?: Json | null
          files?: Json | null
          study_plan_id?: string | null
          member_progress?: Json | null
          created_at?: string | null
          updated_at?: string | null
          last_activity?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          admin_id?: string
          admin_name?: string
          topic?: string
          difficulty?: Database['public']['Enums']['study_difficulty']
          is_public?: boolean | null
          members?: Json | null
          files?: Json | null
          study_plan_id?: string | null
          member_progress?: Json | null
          created_at?: string | null
          updated_at?: string | null
          last_activity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_groups_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_groups_study_plan_id_fkey"
            columns: ["study_plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          }
        ]
      }
      task_completions: {
        Row: {
          id: string
          user_id: string
          study_plan_id: string
          task_id: string
          day_index: number
          task_index: number
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          task_id: string
          day_index: number
          task_index: number
          completed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          task_id?: string
          day_index?: number
          task_index?: number
          completed_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_study_plan_id_fkey"
            columns: ["study_plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_results: {
        Row: {
          id: string
          user_id: string
          study_plan_id: string
          quiz_id: string
          score: number
          answers: number[] | null
          passed: boolean
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          study_plan_id: string
          quiz_id: string
          score: number
          answers?: number[] | null
          passed: boolean
          completed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          study_plan_id?: string
          quiz_id?: string
          score?: number
          answers?: number[] | null
          passed?: boolean
          completed_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_study_plan_id_fkey"
            columns: ["study_plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan_id: string
          status: Database['public']['Enums']['subscription_status']
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean | null
          trial_end: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_id: string
          status?: Database['public']['Enums']['subscription_status']
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          trial_end?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_id?: string
          status?: Database['public']['Enums']['subscription_status']
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          trial_end?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_history: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          stripe_payment_intent_id: string | null
          stripe_invoice_id: string | null
          amount: number
          currency: string
          status: Database['public']['Enums']['payment_status']
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_invoice_id?: string | null
          amount: number
          currency?: string
          status: Database['public']['Enums']['payment_status']
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_invoice_id?: string | null
          amount?: number
          currency?: string
          status?: Database['public']['Enums']['payment_status']
          description?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          }
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
      study_difficulty: "beginner" | "intermediate" | "advanced"
      study_time: "morning" | "afternoon" | "evening" | "night"
      subscription_status: "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "trialing" | "unpaid"
      payment_status: "succeeded" | "pending" | "failed" | "canceled" | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}