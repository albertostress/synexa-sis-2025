import { FontSizeControl, FontSizeDemo } from '@/components/FontSizeControl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFontSize } from '@/hooks/useFontSize';
import { Type, Settings, TestTube } from 'lucide-react';

export default function FontSizeTest() {
  const { currentConfig } = useFontSize();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <TestTube className="w-8 h-8 mr-3" />
            Teste de Tamanho de Fonte
          </h1>
          <p className="text-muted-foreground">
            Demonstração do sistema de controle de fonte do Synexa
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Escala Atual: {currentConfig.label} ({Math.round(currentConfig.multiplier * 100)}%)
        </Badge>
      </div>

      {/* Controles de fonte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Type className="w-5 h-5 mr-2" />
            Controles de Tamanho de Fonte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Controle Padrão</h3>
            <FontSizeControl showLabel />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Controle Compacto</h3>
            <FontSizeControl variant="compact" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Controle por Ícone (como na barra superior)</h3>
            <FontSizeControl variant="icon" />
          </div>
        </CardContent>
      </Card>

      {/* Demonstração */}
      <FontSizeDemo />

      {/* Teste de elementos diversos */}
      <Card>
        <CardHeader>
          <CardTitle>Teste de Diversos Elementos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Títulos */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Título H1 (4xl)</h1>
            <h2 className="text-3xl font-semibold">Título H2 (3xl)</h2>
            <h3 className="text-2xl font-medium">Título H3 (2xl)</h3>
            <h4 className="text-xl">Título H4 (xl)</h4>
            <h5 className="text-lg">Título H5 (lg)</h5>
            <h6 className="text-base font-medium">Título H6 (base)</h6>
          </div>

          {/* Parágrafos */}
          <div className="space-y-4">
            <p className="text-lg">
              Este é um parágrafo grande (lg). Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <p className="text-base">
              Este é um parágrafo normal (base). Ut enim ad minim veniam, quis nostrud exercitation 
              ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p className="text-sm text-muted-foreground">
              Este é um parágrafo pequeno (sm) usado para informações secundárias. 
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.
            </p>
            <p className="text-xs text-muted-foreground">
              Este é um texto muito pequeno (xs) usado para disclaimers e notas de rodapé.
            </p>
          </div>

          {/* Botões */}
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button size="sm">Botão Pequeno</Button>
              <Button>Botão Normal</Button>
              <Button size="lg">Botão Grande</Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm">Outline Pequeno</Button>
              <Button variant="outline">Outline Normal</Button>
              <Button variant="outline" size="lg">Outline Grande</Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" size="sm">Secundário Pequeno</Button>
              <Button variant="secondary">Secundário Normal</Button>
              <Button variant="secondary" size="lg">Secundário Grande</Button>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default">Badge Padrão</Badge>
              <Badge variant="secondary">Badge Secundário</Badge>
              <Badge variant="outline">Badge Outline</Badge>
              <Badge variant="destructive">Badge Destrutivo</Badge>
            </div>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-semibold">Nome</th>
                  <th className="text-left p-3 font-semibold">Email</th>
                  <th className="text-left p-3 font-semibold">Role</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3 font-medium">João Silva</td>
                  <td className="p-3 text-muted-foreground">joao@escola.ao</td>
                  <td className="p-3">
                    <Badge variant="default">ADMIN</Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                      Ativo
                    </Badge>
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">Maria Santos</td>
                  <td className="p-3 text-muted-foreground">maria@escola.ao</td>
                  <td className="p-3">
                    <Badge variant="secondary">PROFESSOR</Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                      Ativo
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Instruções de Uso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Atalhos de Teclado:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl/Cmd + +</kbd> - Aumentar fonte</li>
                <li><kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl/Cmd + -</kbd> - Diminuir fonte</li>
                <li><kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl/Cmd + 0</kbd> - Resetar para padrão</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Controles Visuais:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Ícone de fonte na barra superior (disponível em todas as páginas)</li>
                <li>Controles completos na página de Configurações</li>
                <li>As configurações são salvas automaticamente</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Opções Disponíveis:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Pequeno (87.5%)</strong> - Para telas menores ou preferência por mais conteúdo</li>
                <li><strong>Normal (100%)</strong> - Tamanho padrão recomendado</li>
                <li><strong>Grande (112.5%)</strong> - Ligeiramente maior para melhor legibilidade</li>
                <li><strong>Extra Grande (125%)</strong> - Muito mais legível</li>
                <li><strong>Enorme (150%)</strong> - Para acessibilidade ou preferências específicas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}