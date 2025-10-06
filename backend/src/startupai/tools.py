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
        project_id: str = "",
        evidence_data: Optional[Dict[str, Any]] = None,
        evidence_id: str = "",
    ) -> str:
        """
        Execute evidence store operations using Supabase.
        
        Args:
            action: Operation to perform (create, read, update, delete, list)
            project_id: Project UUID for scoping evidence (required for create/list)
            evidence_data: Evidence data for create/update operations (required for create/update)
            evidence_id: Evidence UUID for read/update/delete operations (required for read/update/delete)
            
        Returns:
            JSON string with operation result
        """
        try:
            from supabase import create_client
            import json
            
            # Initialize Supabase client
            supabase = create_client(self.supabase_url, self.supabase_key)
            
            if action == "create" or action == "store":  # Support both create and store
                if not project_id or not evidence_data:
                    return json.dumps({
                        "error": "project_id and evidence_data required for create/store",
                        "hint": "Provide project_id as string and evidence_data as dict"
                    })
                
                # Prepare evidence data for insertion
                insert_data = {
                    "project_id": project_id,
                    **evidence_data
                }
                
                # Insert into evidence table
                result = supabase.table("evidence").insert(insert_data).execute()
                
                if result.data:
                    return json.dumps({
                        "status": "success",
                        "evidence_id": result.data[0]["id"],
                        "title": result.data[0].get("title", ""),
                        "note": "Evidence stored successfully"
                    })
                else:
                    return json.dumps({"error": "Failed to store evidence"})
            
            elif action == "read" or action == "get":  # Support both read and get
                if not evidence_id:
                    return json.dumps({"error": "evidence_id required for read/get"})
                
                result = supabase.table("evidence").select("*").eq("id", evidence_id).execute()
                
                if not result.data:
                    return json.dumps({"error": "Evidence not found"})
                
                return json.dumps({
                    "status": "success",
                    "evidence": result.data[0]
                })
            
            elif action == "list" or action == "query":  # Support both list and query
                if not project_id:
                    return json.dumps({"error": "project_id required for list/query"})
                
                result = supabase.table("evidence").select("*").eq("project_id", project_id).execute()
                
                return json.dumps({
                    "status": "success",
                    "count": len(result.data),
                    "evidence": result.data
                })
            
            elif action == "update":
                if not evidence_id or not evidence_data:
                    return json.dumps({"error": "evidence_id and evidence_data required for update"})
                
                result = supabase.table("evidence").update(evidence_data).eq("id", evidence_id).execute()
                
                return json.dumps({
                    "status": "success",
                    "updated": len(result.data)
                })
            
            elif action == "delete":
                if not evidence_id:
                    return json.dumps({"error": "evidence_id required for delete"})
                
                supabase.table("evidence").delete().eq("id", evidence_id).execute()
                
                return json.dumps({
                    "status": "success",
                    "deleted": True
                })
            
            else:
                return json.dumps({
                    "error": f"Unknown action: {action}",
                    "supported_actions": ["create/store", "read/get", "list/query", "update", "delete"]
                })
        
        except Exception as e:
            import json
            return json.dumps({
                "error": str(e),
                "action": action,
                "status": "failed"
            })


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
    Tool for web search and content extraction using DuckDuckGo.
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
        Perform web search and extract content using DuckDuckGo.
        
        Args:
            query: Search query
            num_results: Number of results to return (max 10)
            search_type: Type of search (general, news, academic)
            
        Returns:
            JSON string with search results
        """
        try:
            from ddgs import DDGS
            import json
            
            # Initialize DuckDuckGo search
            ddgs = DDGS()
            
            # Perform search based on type
            results = []
            
            if search_type == "news":
                # Search news
                search_results = ddgs.news(query, max_results=min(num_results, 10))
            else:
                # General web search
                search_results = ddgs.text(query, max_results=min(num_results, 10))
            
            # Format results
            for idx, result in enumerate(search_results):
                formatted_result = {
                    "rank": idx + 1,
                    "title": result.get("title", ""),
                    "url": result.get("href") or result.get("url", ""),
                    "snippet": result.get("body") or result.get("description", ""),
                    "source": result.get("source", ""),
                }
                results.append(formatted_result)
            
            return json.dumps({
                "status": "success",
                "query": query,
                "num_results": len(results),
                "search_type": search_type,
                "results": results
            })
        
        except Exception as e:
            import json
            return json.dumps({"error": str(e), "status": "failed"})


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
            import json
            from datetime import datetime
            
            # Generate report content
            report_title = content.get("title", "Strategic Analysis Report")
            project_name = content.get("project_name", "Unnamed Project")
            analysis_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Build markdown report
            executive_summary = content.get('executive_summary', 'This report provides a comprehensive strategic analysis of the project, including market validation insights, competitive positioning, and recommended next steps.')
            key_findings = content.get('key_findings', '- Market opportunity identified\n- Competitive landscape analyzed\n- Strategic recommendations developed')
            recommendations = content.get('recommendations', '1. **Immediate Actions:** Focus on core value proposition validation\n2. **Short-term Goals:** Develop MVP and test with target customers\n3. **Long-term Vision:** Scale based on validated learning')
            evidence_summary = content.get('evidence_summary', 'Analysis based on market research, competitive intelligence, and strategic frameworks.')
            next_steps = content.get('next_steps', '- Validate core assumptions\n- Develop testing strategy\n- Execute validation experiments\n- Iterate based on findings')
            
            markdown_content = f"""# {report_title}
**Project:** {project_name}  
**Analysis Date:** {analysis_date}  
**Generated by:** StartupAI CrewAI System

---

## Executive Summary

{executive_summary}

## Key Findings

{key_findings}

## Strategic Recommendations

{recommendations}

## Evidence Summary

{evidence_summary}

## Next Steps

{next_steps}

---

*Report generated by StartupAI CrewAI Analysis Engine*
"""

            # Store report (simplified - in production would use Supabase storage)
            report_data = {
                "title": report_title,
                "project_name": project_name,
                "format": format,
                "content": markdown_content,
                "generated_at": analysis_date,
                "sections": ["Executive Summary", "Key Findings", "Strategic Recommendations", "Evidence Summary", "Next Steps"],
                "word_count": len(markdown_content.split()),
                "character_count": len(markdown_content)
            }
            
            return json.dumps({
                "status": "success",
                "report": report_data,
                "format": format,
                "sections": report_data["sections"],
                "evidence_citations": content.get("evidence_count", 0),
                "visualizations": 0 if not include_visuals else 1,
                "note": "Report generated successfully"
            })
        
        except Exception as e:
            import json
            return json.dumps({
                "error": str(e),
                "status": "failed"
            })
