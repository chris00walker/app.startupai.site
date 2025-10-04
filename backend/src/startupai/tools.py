"""
Custom CrewAI Tools for StartupAI Platform
Integrates with Supabase, vector search, web search, and report generation
"""

import os
from typing import Optional, List, Dict, Any
from crewai.tools import BaseTool
from pydantic import Field


class EvidenceStoreTool(BaseTool):
    """
    Tool for storing and retrieving evidence from Supabase.
    Implements CRUD operations for evidence items with metadata.
    """
    
    name: str = "Evidence Store"
    description: str = (
        "Store and retrieve evidence items from the database. "
        "Use this to save research findings, retrieve previous evidence, "
        "and manage the evidence inventory for strategic analysis."
    )
    
    supabase_url: str = Field(default_factory=lambda: os.getenv("SUPABASE_URL", ""))
    supabase_key: str = Field(default_factory=lambda: os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))
    
    def _run(
        self,
        action: str,
        project_id: Optional[str] = None,
        evidence_data: Optional[Dict[str, Any]] = None,
        evidence_id: Optional[str] = None,
    ) -> str:
        """
        Execute evidence store operations.
        
        Args:
            action: Operation to perform (create, read, update, delete, list)
            project_id: Project UUID for scoping evidence
            evidence_data: Evidence data for create/update operations
            evidence_id: Evidence UUID for read/update/delete operations
            
        Returns:
            JSON string with operation result
        """
        try:
            from supabase import create_client
            
            client = create_client(self.supabase_url, self.supabase_key)
            
            if action == "create":
                if not project_id or not evidence_data:
                    return '{"error": "project_id and evidence_data required for create"}'
                
                result = client.table("evidence").insert({
                    "project_id": project_id,
                    **evidence_data
                }).execute()
                
                return f'{{"status": "success", "evidence_id": "{result.data[0]["id"]}"}}'
            
            elif action == "read":
                if not evidence_id:
                    return '{"error": "evidence_id required for read"}'
                
                result = client.table("evidence").select("*").eq("id", evidence_id).execute()
                
                if not result.data:
                    return '{"error": "Evidence not found"}'
                
                return f'{{"status": "success", "evidence": {result.data[0]}}}'
            
            elif action == "list":
                if not project_id:
                    return '{"error": "project_id required for list"}'
                
                result = client.table("evidence").select("*").eq("project_id", project_id).execute()
                
                return f'{{"status": "success", "count": {len(result.data)}, "evidence": {result.data}}}'
            
            elif action == "update":
                if not evidence_id or not evidence_data:
                    return '{"error": "evidence_id and evidence_data required for update"}'
                
                result = client.table("evidence").update(evidence_data).eq("id", evidence_id).execute()
                
                return f'{{"status": "success", "updated": {len(result.data)}}}'
            
            elif action == "delete":
                if not evidence_id:
                    return '{"error": "evidence_id required for delete"}'
                
                client.table("evidence").delete().eq("id", evidence_id).execute()
                
                return '{"status": "success", "deleted": true}'
            
            else:
                return f'{{"error": "Unknown action: {action}"}}'
        
        except Exception as e:
            return f'{{"error": "{str(e)}"}}'


class VectorSearchTool(BaseTool):
    """
    Tool for semantic search using pgvector in Supabase.
    Finds similar evidence based on vector embeddings.
    """
    
    name: str = "Vector Search"
    description: str = (
        "Perform semantic search across evidence using vector embeddings. "
        "Use this to find similar evidence, discover patterns, "
        "and identify related strategic insights."
    )
    
    supabase_url: str = Field(default_factory=lambda: os.getenv("SUPABASE_URL", ""))
    supabase_key: str = Field(default_factory=lambda: os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))
    openai_api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    
    def _run(
        self,
        query: str,
        project_id: str,
        match_threshold: float = 0.7,
        match_count: int = 10,
    ) -> str:
        """
        Search for similar evidence using vector embeddings.
        
        Args:
            query: Search query text
            project_id: Project UUID to scope search
            match_threshold: Minimum similarity score (0-1)
            match_count: Maximum number of results
            
        Returns:
            JSON string with matching evidence items
        """
        try:
            from supabase import create_client
            from openai import OpenAI
            
            # Generate embedding for query
            openai_client = OpenAI(api_key=self.openai_api_key)
            response = openai_client.embeddings.create(
                input=query,
                model="text-embedding-ada-002"
            )
            query_embedding = response.data[0].embedding
            
            # Search using Supabase RPC function
            supabase = create_client(self.supabase_url, self.supabase_key)
            result = supabase.rpc(
                "match_evidence",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": match_threshold,
                    "match_count": match_count,
                    "project_id": project_id,
                }
            ).execute()
            
            return f'{{"status": "success", "count": {len(result.data)}, "matches": {result.data}}}'
        
        except Exception as e:
            return f'{{"error": "{str(e)}"}}'


class WebSearchTool(BaseTool):
    """
    Tool for web search and content extraction.
    Searches the web for relevant information and extracts key content.
    """
    
    name: str = "Web Search"
    description: str = (
        "Search the web for relevant information on strategic questions. "
        "Use this to gather external evidence, market data, competitor information, "
        "and industry insights from public sources."
    )
    
    def _run(
        self,
        query: str,
        num_results: int = 10,
        search_type: str = "general",
    ) -> str:
        """
        Perform web search and extract content.
        
        Args:
            query: Search query
            num_results: Number of results to return
            search_type: Type of search (general, news, academic)
            
        Returns:
            JSON string with search results
        """
        try:
            # TODO: Implement actual web search using DuckDuckGo or similar
            # For now, return a placeholder response
            
            return f'''{{
                "status": "success",
                "query": "{query}",
                "num_results": {num_results},
                "search_type": "{search_type}",
                "results": [
                    {{
                        "title": "Example Result",
                        "url": "https://example.com",
                        "snippet": "This is a placeholder result. Implement actual web search.",
                        "source": "Example Source",
                        "relevance_score": 0.9
                    }}
                ],
                "note": "Web search implementation pending"
            }}'''
        
        except Exception as e:
            return f'{{"error": "{str(e)}"}}'


class ReportGeneratorTool(BaseTool):
    """
    Tool for generating formatted strategic reports.
    Creates professional reports with evidence citations and visualizations.
    """
    
    name: str = "Report Generator"
    description: str = (
        "Generate professional strategic reports with evidence citations. "
        "Use this to create executive summaries, detailed findings reports, "
        "and presentation materials for strategic analysis."
    )
    
    def _run(
        self,
        content: Dict[str, Any],
        format: str = "markdown",
        include_visuals: bool = True,
    ) -> str:
        """
        Generate a formatted report from analysis content.
        
        Args:
            content: Report content including sections and evidence
            format: Output format (markdown, html, pdf)
            include_visuals: Whether to include charts and visualizations
            
        Returns:
            JSON string with generated report details
        """
        try:
            # TODO: Implement actual report generation
            # For now, return a placeholder response
            
            return f'''{{
                "status": "success",
                "format": "{format}",
                "sections": ["Executive Summary", "Findings", "Recommendations"],
                "evidence_citations": 0,
                "visualizations": 0,
                "note": "Report generation implementation pending"
            }}'''
        
        except Exception as e:
            return f'{{"error": "{str(e)}"}}'
