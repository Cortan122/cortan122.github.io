using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

/// <summary>
/// Задание с Экзаменационной Контрольной Работы №1
/// </summary>
/// <remarks>
/// <para>Автор: Борисов Костя</para>
/// <para>Группа: БПИ199</para>
/// <para>Дата: 23.10.2019</para>
/// <para>Вариант: 0</para>
/// </remarks>
namespace Шаблон {
  class Program {
    /// <summary>
    /// Считавыет целое число с stdin, и проверяет попадает ли оно в отрезок [lowerBound,upperBound].
    /// Если число неправильное, просит ввести его повторно.
    /// </summary>
    /// <returns>
    /// Введенное число.
    /// </returns>
    /// <param name="name">Название этого числа.</param>
    /// <param name="lowerBound">Минимально возможное значение числа.</param>
    /// <param name="upperBound">Максимально возможное значение числа.</param>
    static int ReadInt(string name, int lowerBound = int.MinValue, int upperBound = int.MaxValue) {
      int r;
      do {
        string tempstr1 = lowerBound != int.MinValue? lowerBound + " <= ": "";
        string tempstr2 = upperBound != int.MaxValue? " <= " + upperBound: "";
        Console.Write($"Введите {name} ({tempstr1}int{tempstr2}): ");
      } while (!int.TryParse(Console.ReadLine(), out r) || r < lowerBound || r > upperBound);
      return r;
    }

    /// <summary>
    /// Считавыет символ с stdin, и проверяет попадает ли оно в отрезок [lowerBound,upperBound].
    /// Если символ неправильный, просит ввести его повторно.
    /// </summary>
    /// <returns>
    /// Введенный символ.
    /// </returns>
    /// <param name="name">Название этого символа.</param>
    /// <param name="lowerBound">Минимально возможное значение символа.</param>
    /// <param name="upperBound">Максимально возможное значение символа.</param>
    static char ReadChar(string name, char lowerBound = char.MinValue, char upperBound = char.MaxValue) {
      char r;
      do {
        string tempstr1 = lowerBound != char.MinValue? lowerBound + " <= ": "";
        string tempstr2 = upperBound != char.MaxValue? " <= " + upperBound: "";
        Console.Write($"Введите {name} ({tempstr1}char{tempstr2}): ");
      } while (!char.TryParse(Console.ReadLine(), out r) || r < lowerBound || r > upperBound);
      return r;
    }

    /// <summary>
    /// Считавыет действительное число с stdin, и проверяет попадает ли оно в отрезок [lowerBound,upperBound].
    /// Если число неправильное, просит ввести его повторно.
    /// </summary>
    /// <returns>
    /// Введенное число.
    /// </returns>
    /// <param name="name">Название этого числа.</param>
    /// <param name="lowerBound">Минимально возможное значение числа.</param>
    /// <param name="upperBound">Максимально возможное значение числа.</param>
    static double ReadDouble(string name, double lowerBound = double.MinValue, double upperBound = double.MaxValue) {
      double r;
      do {
        string tempstr1 = lowerBound != double.MinValue? lowerBound + " <= ": "";
        string tempstr2 = upperBound != double.MaxValue? " <= " + upperBound: "";
        Console.Write($"Введите {name} ({tempstr1}double{tempstr2}): ");
      } while (!double.TryParse(Console.ReadLine(), out r) || r < lowerBound || r > upperBound);
      return r;
    }

    // Перегрузка наслучай, если нет name.
    static int ReadInt(int lowerBound = int.MinValue, int upperBound = int.MaxValue) {
      return ReadInt("целое число", lowerBound, upperBound);
    }

    // Перегрузка наслучай, если нет name.
    static char ReadChar(char lowerBound = char.MinValue, char upperBound = char.MaxValue) {
      return ReadChar("символ", lowerBound, upperBound);
    }

    // Перегрузка наслучай, если нет name.
    static double ReadDouble(double lowerBound = double.MinValue, double upperBound = double.MaxValue) {
      return ReadDouble("действительное число", lowerBound, upperBound);
    }

    /// <summary>
    /// Запускает f() и предлогает пользователю повторить.
    /// </summary>
    static void Loop(Action f) {
      while (true) {
        f();
        // if Console.IsOutputRedirected is True Console.ReadKey() throws an exeption
        if (Console.IsOutputRedirected)return;
        Console.WriteLine("Нажмите Enter чтобы повторить");
        if (Console.ReadKey(true).Key != ConsoleKey.Enter)break;
      }
    }

    /// <summary>
    /// Открывает текстовый файл, считывает весь текст файла в строку и затем закрывает файл.
    /// если неполучилось возвращает null
    /// </summary>
    static string TryReadAllText(string path){
      try {
        return File.ReadAllText(path);
      } catch (FileNotFoundException) {
        Console.WriteLine("Файл не существует");
      } catch (IOException) {
        Console.WriteLine("Ошибка ввода-вывода");
      } catch (System.Security.SecurityException) {
        Console.WriteLine("Ошибка безопасности");
      } catch (UnauthorizedAccessException) {
        Console.WriteLine("У вас нет разрешения на создание/чтение файла");
      }
      return null;
    }

    static Random rng = new Random();

    static void Main() {
      Loop(() => {
        var n = ReadInt(1, 1000);
        // your code goes here
      });
    }
  }
}
