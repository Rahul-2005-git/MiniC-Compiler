from dataclasses import dataclass, field
from typing import List, Optional, Any

# ─── Base ────────────────────────────────────────────────────────────────────

class ASTNode:
    def to_dict(self) -> dict:
        raise NotImplementedError

def _children(*kids) -> List[dict]:
    return [k.to_dict() for k in kids if k is not None]

# ─── Expressions ─────────────────────────────────────────────────────────────

@dataclass
class IntLiteral(ASTNode):
    value: int
    def to_dict(self): return {"node": "IntLiteral", "value": self.value}

@dataclass
class FloatLiteral(ASTNode):
    value: float
    def to_dict(self): return {"node": "FloatLiteral", "value": self.value}

@dataclass
class StringLiteral(ASTNode):
    value: str
    def to_dict(self): return {"node": "StringLiteral", "value": self.value}

@dataclass
class Identifier(ASTNode):
    name: str
    def to_dict(self): return {"node": "Identifier", "name": self.name}

@dataclass
class BinOp(ASTNode):
    op: str
    left: ASTNode
    right: ASTNode
    def to_dict(self):
        return {"node": "BinOp", "op": self.op,
                "children": [self.left.to_dict(), self.right.to_dict()]}

@dataclass
class UnaryOp(ASTNode):
    op: str
    operand: ASTNode
    def to_dict(self):
        return {"node": "UnaryOp", "op": self.op,
                "children": [self.operand.to_dict()]}

@dataclass
class Assignment(ASTNode):
    name: str
    value: ASTNode
    def to_dict(self):
        return {"node": "Assignment", "name": self.name,
                "children": [self.value.to_dict()]}

@dataclass
class FunctionCall(ASTNode):
    name: str
    args: List[ASTNode]
    def to_dict(self):
        return {"node": "FunctionCall", "name": self.name,
                "children": [a.to_dict() for a in self.args]}

# ─── Statements ──────────────────────────────────────────────────────────────

@dataclass
class VarDecl(ASTNode):
    type_: str
    name: str
    init: Optional[ASTNode] = None
    def to_dict(self):
        d = {"node": "VarDecl", "type": self.type_, "name": self.name}
        if self.init:
            d["children"] = [self.init.to_dict()]
        return d

@dataclass
class ReturnStmt(ASTNode):
    value: Optional[ASTNode]
    def to_dict(self):
        d = {"node": "ReturnStmt"}
        if self.value:
            d["children"] = [self.value.to_dict()]
        return d

@dataclass
class IfStmt(ASTNode):
    condition: ASTNode
    then_body: List[ASTNode]
    else_body: Optional[List[ASTNode]] = None
    def to_dict(self):
        d = {"node": "IfStmt",
             "condition": self.condition.to_dict(),
             "then": [s.to_dict() for s in self.then_body]}
        if self.else_body is not None:
            d["else"] = [s.to_dict() for s in self.else_body]
        return d

@dataclass
class WhileStmt(ASTNode):
    condition: ASTNode
    body: List[ASTNode]
    def to_dict(self):
        return {"node": "WhileStmt",
                "condition": self.condition.to_dict(),
                "body": [s.to_dict() for s in self.body]}

@dataclass
class ForStmt(ASTNode):
    init: Optional[ASTNode]
    condition: Optional[ASTNode]
    update: Optional[ASTNode]
    body: List[ASTNode]
    def to_dict(self):
        d = {"node": "ForStmt",
             "body": [s.to_dict() for s in self.body]}
        if self.init:      d["init"]      = self.init.to_dict()
        if self.condition: d["condition"] = self.condition.to_dict()
        if self.update:    d["update"]    = self.update.to_dict()
        return d

@dataclass
class ExprStmt(ASTNode):
    expr: ASTNode
    def to_dict(self):
        return {"node": "ExprStmt", "children": [self.expr.to_dict()]}

# ─── Top-level ────────────────────────────────────────────────────────────────

@dataclass
class FunctionDef(ASTNode):
    return_type: str
    name: str
    params: List[tuple]      # [(type, name), ...]
    body: List[ASTNode]
    def to_dict(self):
        return {"node": "FunctionDef",
                "returnType": self.return_type,
                "name": self.name,
                "params": [{"type": t, "name": n} for t, n in self.params],
                "body": [s.to_dict() for s in self.body]}

@dataclass
class Program(ASTNode):
    functions: List[FunctionDef]
    def to_dict(self):
        return {"node": "Program",
                "children": [f.to_dict() for f in self.functions]}
